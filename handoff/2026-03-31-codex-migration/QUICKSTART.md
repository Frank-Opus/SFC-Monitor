# Quickstart For Next Codex

Start here if you only have 30 seconds.

## Repo / path

- Repo: `Frank-Opus/SFC-Monitor`
- Local path: `/home/wanguancheng/.openclaw/workspace-hui-claw-4-bot/worldmonitor`
- Public entry to check: `https://sfc-monitor.vercel.app`

## Main problem

Production is now live on commit `fbd96b16`, which downgraded Vercel cron schedules to fit Hobby.
Deployment is no longer blocked.
The remaining problem is that daily cron is far too infrequent for many current health thresholds, so `api/health` is still heavily `UNHEALTHY`.

## Current truth

- Production alias points to Vercel deployment `dpl_3s354GtmU7t9WQhB78LkogVDGtbi`
- GitHub status for `fbd96b16` is fully `success`
- Latest checked health snapshot was `106 total / 5 ok / 25 warn / 76 crit`
- Direct manual `curl` to `/api/cron-warm`, `/api/cron-seed-national-debt`, and `/api/seed-health` still returns `403`

## Immediate next fix

Do not chase the old CI issue trail.
The real next decision is whether to:

1. accept "deploys on Hobby" as done
2. re-tune `api/health.js` for daily cron reality
3. add another refresh path outside Vercel Hobby cron limits

## Secrets

Use local file:

- `worldmonitor/.env.local`

Do not put raw secrets into git-tracked notes.

## Then do this

1. Confirm production is still on `fbd96b16`
2. Recheck `/api/health?compact=1`
3. Decide whether to relax health thresholds or add another refresh mechanism
4. Validate future scheduled runs from Vercel logs or freshness metadata, not only direct `curl`
