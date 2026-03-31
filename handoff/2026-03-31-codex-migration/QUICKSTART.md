# Quickstart For Next Codex

Start here if you only have 30 seconds.

## Repo / path

- Repo: `Frank-Opus/SFC-Monitor`
- Local path: `/home/wanguancheng/.openclaw/workspace-hui-claw-4-bot/worldmonitor`
- Public entry to check: `https://sfc-monitor.vercel.app`

## Main problem

Production is still on old commit `84d1da4a`, so the new Vercel cron routes are not live yet.
Because of that:

- `/api/cron-warm` is still `404`
- `/api/cron-seed-national-debt` is still `404`
- `api/health` is still `UNHEALTHY`
- lots of seed data is still missing

## Why production is stuck

Latest head had:

- `Test`: success
- `Typecheck`: failure
- `Lint Code`: failure

So Vercel never deployed the cron-support commits.

## Immediate next fix

Check and finish these local changes first:

- `api/cron-seed-national-debt.ts`
- `tests/mcp-proxy.test.mjs`

Those are the last known edits aimed at clearing current `Typecheck` + `Lint` blockers.

## Secrets

Use local file:

- `worldmonitor/.env.local`

Do not put raw secrets into git-tracked notes.

## Then do this

1. Get `Typecheck` green
2. Get `Lint Code` green
3. Confirm Vercel production moves off `84d1da4a`
4. Hit `/api/cron-warm?group=fast`
5. Hit `/api/cron-seed-national-debt`
6. Recheck `/api/health?compact=1` and `/api/seed-health`
