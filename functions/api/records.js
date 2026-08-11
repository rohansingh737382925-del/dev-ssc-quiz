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

export async function onRequestGet(context) {
  try {
    const kv = context.env.STOPWATCH_RECORDS;
    const result = await kv.list({ prefix: "day:" });
    const records = [];

    for (const key of result.keys) {
      const value = await kv.get(key.name, "json");
      if (value) records.push(value);
    }

    records.sort((a, b) => b.date.localeCompare(a.date));

    return json({ ok: true, records });
  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Failed to read records"
    }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const kv = context.env.STOPWATCH_RECORDS;
    const body = await context.request.json();

    const date = String(body.date || "");
    if (!validDate(date)) {
      return json({ ok: false, error: "Invalid date" }, 400);
    }

    const studyMs = Number(body.studyMs);
    const awakeMs = Number(body.awakeMs);

    if (
      !Number.isFinite(studyMs) ||
      !Number.isFinite(awakeMs) ||
      studyMs < 0 ||
      awakeMs < 0
    ) {
      return json({ ok: false, error: "Invalid timer values" }, 400);
    }

    const incoming = {
      date,
      studyMs: Math.floor(studyMs),
      awakeMs: Math.floor(awakeMs),
      uploadedAt: new Date().toISOString()
    };

    // Multiple devices can upload the same date.
    // Keep the record with the highest Study Time.
    const key = `day:${date}`;
    const existing = await kv.get(key, "json");

    let record = incoming;

    if (
      existing &&
      Number.isFinite(Number(existing.studyMs)) &&
      Number(existing.studyMs) >= incoming.studyMs
    ) {
      // Existing record wins when its Study Time is equal or higher.
      record = existing;
    }

    await kv.put(key, JSON.stringify(record));

    return json({
      ok: true,
      record,
      selected: record === incoming ? "incoming" : "existing"
    });
  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Failed to save record"
    }, 500);
  }
}
