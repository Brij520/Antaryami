# Antaryami

Free, text-first Vedic prediction app. Ask a question in plain language, get a
reading computed from a real sidereal birth chart — with the chart facts shown
alongside the prose.

- **No accounts, no API keys, no paid model calls.** All computation is local.
- **Deterministic:** the same birth data always produces the same chart.
- **Explainable:** every reading lists the houses, sign lords and placements it used.

## How it works

```
index.html          single-page UI (vanilla JS, no build step)
api/predict.js      Vercel serverless function: POST { question, birth }
lib/chart.js        sidereal chart: julian day, Lahiri ayanamsa, ascendant, Moon/nakshatra
lib/predict.js      text -> topics -> templated lines grounded in the chart
tests/              node:test suite (node --test tests/)
```

### API

```bash
curl -X POST https://<deployment>/api/predict \
  -H 'Content-Type: application/json' \
  -d '{"question":"Will I get a promotion?","birth":{"date":"1995-08-15","time":"06:30","latitude":23.3441,"longitude":85.3096}}'
```

Response: `{ ok, question, chart, reading }` where `reading` has `summary`,
`sections[]`, `grounding` and `disclaimer`.

## Local development

```bash
node dev-server.mjs          # http://localhost:3000  (static + /api, no deps)
node --test tests/           # 9 tests, no dependencies
```

## Deploy

Deployed as a Vercel project rooted at this directory. Vercel auto-detects
`api/predict.js`; `index.html` is served as the site root.

## Scope and honesty

Antaryami reads **your** birth data. It is not a clone of, and shares no code or
content with, any commercial astrology app; it is not affiliated with AstroTalk.
Readings are assembled from classical whole-sign house significations and are
offered as entertainment and self-reflection — not medical, legal, financial, or
any other professional advice.
