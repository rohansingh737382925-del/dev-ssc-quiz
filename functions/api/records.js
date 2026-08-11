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

function isValidRecord(value) {
  return value &&
    validDate(String(value.date || "")) &&
    Number.isFinite(Number(value.studyMs)) &&
    Number.isFinite(Number(value.awakeMs)) &&
    Number(value.studyMs) >= 0 &&
    Number(value.awakeMs) >= 0;
}

export async function onRequestGet(context) {
  try {
    const kv = context.env.STOPWATCH_RECORDS;

    // There can be several uploads for the same day (from different
    // phones/browsers). Read all candidates and keep only the one
    // with the highest Study Time for each date.
    const bestByDate = new Map();
    let cursor = undefined;

    do {
      const options = { prefix: "day:", limit: 1000 };
      if (cursor) options.cursor = cursor;

      const result = await kv.list(options);

      for (const key of result.keys) {
        const value = await kv.get(key.name, "json");
        if (!isValidRecord(value)) continue;

        const date = String(value.date);
        const current = bestByDate.get(date);

        if (
          !current ||
          Number(value.studyMs) > Number(current.studyMs) ||
          (
            Number(value.studyMs) === Number(current.studyMs) &&
            String(value.uploadedAt || "") > String(current.uploadedAt || "")
          )
        ) {
          bestByDate.set(date, value);
        }
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    const records = Array.from(bestByDate.values())
      .sort((a, b) => b.date.localeCompare(a.date));

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

    const record = {
      date,
      studyMs: Math.floor(studyMs),
      awakeMs: Math.floor(awakeMs),
      uploadedAt: new Date().toISOString()
    };

    // IMPORTANT:
    // Never do read -> compare -> overwrite on the same key.
    // Multiple devices can upload at nearly the same time.
    // Each upload gets its own immutable candidate key.
    // The GET endpoint then selects the highest Study Time.
    const uploadKey =
      `day:${date}:upload:${Date.now()}:${crypto.randomUUID()}`;

    await kv.put(uploadKey, JSON.stringify(record));

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
