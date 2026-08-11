const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// GET /api/records
// Track Record ke liye saare daily records laata hai.
export async function onRequestGet(context) {
  try {
    const kv = context.env.STOPWATCH_RECORDS;

    const result = await kv.list({ prefix: "day:" });

    const records = [];

    for (const key of result.keys) {
      const value = await kv.get(key.name, "json");

      if (value) {
        records.push(value);
      }
    }

    records.sort((a, b) => b.date.localeCompare(a.date));

    return json({
      ok: true,
      records
    });

  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Failed to read records"
    }, 500);
  }
}

// POST /api/records
// Current day's Study + Awake time KV mein save/update karta hai.
export async function onRequestPost(context) {
  try {
    const kv = context.env.STOPWATCH_RECORDS;

    const body = await context.request.json();

    const date = String(body.date || "");

    if (!validDate(date)) {
      return json({
        ok: false,
        error: "Invalid date"
      }, 400);
    }

    const studyMs = Number(body.studyMs);
    const awakeMs = Number(body.awakeMs);

    if (
      !Number.isFinite(studyMs) ||
      !Number.isFinite(awakeMs) ||
      studyMs < 0 ||
      awakeMs < 0
    ) {
      return json({
        ok: false,
        error: "Invalid timer values"
      }, 400);
    }

    const record = {
      date,
      studyMs: Math.floor(studyMs),
      awakeMs: Math.floor(awakeMs),
      uploadedAt: new Date().toISOString()
    };

    // Same date par dobara upload hone par
    // purana record update ho jayega, duplicate nahi banega.
    await kv.put(
      `day:${date}`,
      JSON.stringify(record)
    );

    return json({
      ok: true,
      record
    });

  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Failed to save record"
    }, 500);
  }
}
