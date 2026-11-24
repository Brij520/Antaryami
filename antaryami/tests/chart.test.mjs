import test from "node:test";
import assert from "node:assert/strict";

import { computeChart, julianDay, SIGNS, NAKSHATRAS } from "../lib/chart.js";
import { predict, matchTopics } from "../lib/predict.js";

const RANCHI = { latitude: 23.3441, longitude: 85.3096 };

test("julian day matches known epoch", () => {
  // 2000-01-01 12:00 UT is JD 2451545.0
  assert.equal(julianDay({ year: 2000, month: 1, day: 1, hour: 12, minute: 0 }), 2451545.0);
});

test("kitchen-sink birth yields a well-formed chart", () => {
  const c = computeChart({ date: "1995-08-15", time: "06:30", ...RANCHI });
  assert.ok(SIGNS.includes(c.ascendant.sign));
  assert.ok(SIGNS.includes(c.moon.sign));
  assert.ok(NAKSHATRAS.includes(c.moon.nakshatra));
  assert.ok(c.moon.pada >= 1 && c.moon.pada <= 4);
  assert.equal(Object.keys(c.houses).length, 12);
  assert.ok(c.ayanamsa > 23 && c.ayanamsa < 25);
});

test("house numbering wraps correctly from the ascendant", () => {
  const c = computeChart({ date: "1990-01-01", time: "12:00", ...RANCHI });
  for (let i = 1; i <= 12; i += 1) {
    assert.equal(c.houses[i].signIndex, (c.ascendant.signIndex + i - 1) % 12);
  }
});

test("every planet lands in exactly one house", () => {
  const c = computeChart({ date: "1988-03-02", time: "19:45", ...RANCHI });
  const placed = Object.values(c.houses).flatMap((h) => h.occupants);
  assert.equal(placed.length, 4); // Sun, Moon, Rahu, Ketu
  assert.equal(new Set(placed).size, 4);
});

test("computing the same inputs twice is deterministic", () => {
  const a = computeChart({ date: "2001-11-09", time: "03:15", ...RANCHI });
  const b = computeChart({ date: "2001-11-09", time: "03:15", ...RANCHI });
  assert.deepEqual(a, b);
});

test("different birth times produce different ascendants", () => {
  const morning = computeChart({ date: "1995-08-15", time: "05:00", ...RANCHI });
  const evening = computeChart({ date: "1995-08-15", time: "21:00", ...RANCHI });
  assert.notEqual(morning.ascendant.sign, evening.ascendant.sign);
});

test("topic matching picks the right domain", () => {
  assert.equal(matchTopics("Will I get a promotion?").at(0).id, "career");
  assert.equal(matchTopics("when will i marry my girlfriend").at(0).id, "love");
  assert.equal(matchTopics("should i take a loan to buy a house").at(0).id, "money");
  assert.equal(matchTopics("aaahhhh gibberish").at(0).id, "general");
});

test("reading never leaks unreplaced template tokens", () => {
  const c = computeChart({ date: "1999-06-06", time: "08:20", ...RANCHI });
  const questions = [
    "career", "money", "love", "health", "travel", "education", "family", "spirit", "nonsense",
  ];
  for (const q of questions) {
    const r = predict(q, c);
    assert.ok(r.sections.length >= 1);
    for (const section of r.sections) {
      for (const line of section.lines) {
        assert.doesNotMatch(line, /\{[a-z0-9]+\}/i, `unreplaced token in: ${line}`);
        assert.doesNotMatch(line, /occupyies|undefined|null/);
        assert.ok(line.length > 10);
      }
    }
  }
});

test("multi-topic questions return multiple sections", () => {
  const c = computeChart({ date: "1993-02-14", time: "14:00", ...RANCHI });
  const r = predict("Should I move abroad for a better job and more money?", c);
  const ids = r.sections.map((s) => s.topic);
  assert.ok(ids.includes("career"));
  assert.ok(ids.includes("travel") || ids.includes("money"));
});
