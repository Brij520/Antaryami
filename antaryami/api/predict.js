import { computeChart } from "../lib/chart.js";
import { predict, TOPIC_LABELS } from "../lib/predict.js";

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

export default function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "antaryami",
      version: "1.0.0",
      topics: TOPIC_LABELS,
      usage: "POST { question, birth: { date, time, latitude, longitude } }",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: "Use GET for info or POST to ask." });
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 16_384) req.destroy();
  });
  req.on("end", () => {
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      return json(res, 400, { ok: false, error: "Body must be JSON." });
    }

    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    if (question.length === 0) {
      return json(res, 400, { ok: false, error: "question is required." });
    }
    if (question.length > 2000) {
      return json(res, 400, { ok: false, error: "question must be 2000 characters or fewer." });
    }

    const birth = parsed.birth || {};
    if (typeof birth.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birth.date)) {
      return json(res, 400, { ok: false, error: "birth.date must be YYYY-MM-DD." });
    }
    if (typeof birth.time !== "string" || !/^\d{2}:\d{2}$/.test(birth.time)) {
      return json(res, 400, { ok: false, error: "birth.time must be HH:MM (24h)." });
    }
    if (!isNum(birth.latitude) || birth.latitude < -90 || birth.latitude > 90) {
      return json(res, 400, { ok: false, error: "birth.latitude must be between -90 and 90." });
    }
    if (!isNum(birth.longitude) || birth.longitude < -180 || birth.longitude > 180) {
      return json(res, 400, { ok: false, error: "birth.longitude must be between -180 and 180." });
    }

    const [year] = birth.date.split("-").map(Number);
    if (year < 1800 || year > 2200) {
      return json(res, 400, { ok: false, error: "birth.date year must be between 1800 and 2200." });
    }

    const chart = computeChart({
      date: birth.date,
      time: birth.time,
      latitude: birth.latitude,
      longitude: birth.longitude,
    });

    return json(res, 200, {
      ok: true,
      question,
      chart,
      reading: predict(question, chart),
    });
  });

  req.on("error", () => json(res, 400, { ok: false, error: "Request stream failed." }));
}
