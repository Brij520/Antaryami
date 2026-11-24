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

## Deployed

| | |
| --- | --- |
| Vercel project | `antaryami` (`prj_BTghxMXXLrpFHuB6YjxqqSe0YvS7`, team `brij16`) |
| Root directory | `antaryami` |
| Repo / branch | `Brij520/Antaryami` @ `arena/930e3351-antaryami` |
| Production deployment | `dpl_J8YaMwjHpZCswSbbTj5CCLVY8oyt` — READY, promoted |
| URL | https://antaryami-4wut1w7oo-brij16.vercel.app |
| Aliases | `antaryami-brij16.vercel.app`, `antaryami-git-arena-930e3351-antaryami-brij16.vercel.app` |
| Runtime | Node.js 24.x (from `engines`), one serverless function: `api/predict.js` |

The build log shows `Build Completed in /vercel/output`, one Node.js lambda
bundled, and the deployment promoted to production.

### Access

Vercel **Deployment Protection (Vercel Authentication / SSO)** is left **on** by
choice, so the site is reachable only by the signed-in account owner. To open it
to the public later, in the Vercel dashboard:

> Project **antaryami** → Settings → **Deployment Protection** → set
> *Vercel Authentication* to **Disabled** (or **Standard Protection**) → Save.

Custom-domain deployments are exempt from SSO protection by default, so adding a
domain under Settings → Domains also makes it publicly reachable.

Because protection is on, the live HTML/API could not be fetched and verified
from an unauthenticated client. Everything below was verified locally against
the same code that was deployed.
