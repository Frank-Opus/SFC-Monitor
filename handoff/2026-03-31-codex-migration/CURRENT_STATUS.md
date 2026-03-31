# Current Status

## Goal

User chose the pragmatic path: make the new Vercel cron work deploy on Hobby first, even if real-time health remains bad afterward.

## Current blocking truth

Production has already deployed the Hobby-compatible cron changes. The blocking issue is now operational freshness, not CI or deployment.

## Production status at last check

- Public entry checked: `https://sfc-monitor.vercel.app`
- Production commit: `fbd96b16` (`fix(deploy): downgrade vercel crons for hobby`)
- Vercel production deployment: `dpl_3s354GtmU7t9WQhB78LkogVDGtbi`
- GitHub commit status for `fbd96b16`: `success`
- `/api/health?compact=1` -> `UNHEALTHY`
- Health snapshot on `2026-04-01` check: `106 total / 5 ok / 25 warn / 76 crit`
- `/api/cron-warm?group=fast` -> direct manual `curl` still returns `403`
- `/api/cron-seed-national-debt` -> direct manual `curl` still returns `403`
- `/api/seed-health` -> direct manual `curl` still returns `403`

## What changed

- CI blockers were fixed locally and pushed.
- Vercel Hobby rejected the old multi-run-per-day cron expressions.
- `vercel.json` was downgraded to daily Hobby-safe schedules:
  - `/api/cron-warm?group=fast` -> `5 0 * * *`
  - `/api/cron-warm?group=hourly` -> `35 0 * * *`
  - `/api/cron-seed-national-debt` -> `23 3 1 * *`
- After that change, production deployment succeeded and the alias moved to `fbd96b16`.

## Why health is still bad

Most health checks still expect 15 minute to 6 hour freshness windows. Daily Hobby cron cannot keep those datasets fresh, so the app remains operationally unhealthy even though deployment is fixed.

## Important validation caveat

Direct `curl` requests to several protected or internal API routes still return `403`, including non-existent `/api/*` paths. Treat those manual calls as unreliable route-level validation. Use deployed commit / alias status plus health snapshots and scheduled-run observations instead.

## Local working tree at handoff time

Working tree is clean at this point.
