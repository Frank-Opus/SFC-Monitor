# Current Status

## Goal
User wants the entire project to be fully healthy on Vercel only, with no dependency assumptions on external infrastructure.

## Current blocking truth
The repo contains new Vercel cron warm/seed routes, but production has NOT deployed them yet because CI is still blocking release.

## Production status at last check
- Public entry checked: `https://sfc-monitor.vercel.app`
- `/api/cron-warm` -> `404`
- `/api/cron-seed-national-debt` -> `404`
- `/api/health?compact=1` -> `503 UNHEALTHY`
- Health snapshot: `106 total / 2 ok / 27 warn / 77 crit`
- `/api/seed-health` -> `200 degraded`, many seeds still `missing`

## Why production is stuck
Latest Vercel production deployment still points at commit `84d1da4a` (`tune health thresholds and fix smart poll lint`).
Newer commits with cron support have not reached production because GitHub checks are not fully green.

## Latest CI state seen
For head `abaa9d7b`:
- `Test`: success
- `Typecheck`: failure
- `Lint Code`: failure
- `Deploy Gate`: success

## Exact current CI blockers found
### Typecheck
From latest logs, still failing on `api/cron-seed-national-debt.ts`:
- `TS2578`: unused `@ts-expect-error`
- `TS7016`: no declaration file for `../scripts/seed-national-debt.mjs`

### Lint
From latest logs, still failing in `tests/mcp-proxy.test.mjs` on an unused `url` parameter that should be renamed to `_url`.

## Local working tree at handoff time
Uncommitted local changes exist for:
- `api/cron-seed-national-debt.ts`
- `tests/mcp-proxy.test.mjs`
These edits were made to fix the exact two blockers above and should be committed/pushed next.
