# Next Steps

## 1. Treat deployment as complete

Do not spend more time on the old CI blockers. They are already fixed, merged, and deployed in `fbd96b16`.

## 2. Decide what "done" means under Hobby

If the goal is only "new code deploys on Hobby", this is complete.
If the goal is "dashboard health becomes green on Vercel only", more product-level compromise is required.

## 3. Make health semantics match daily cron, or add another refresh path

Pick one direction:

- relax `api/health.js` freshness thresholds for datasets now refreshed daily on Hobby
- downgrade some checks from `CRIT` to `WARN` or `EMPTY_ON_DEMAND`
- add a non-cron refresh mechanism that Hobby can still run reliably

Without one of those changes, health will stay red.

## 4. Verify real scheduled execution later, not by direct curl alone

Direct manual `curl` to:

- `/api/cron-warm?group=fast`
- `/api/cron-seed-national-debt`
- `/api/seed-health`

currently returns `403`, so it is not a trustworthy proof that scheduled execution is broken.

Better validation paths:

- inspect future Vercel cron execution logs
- compare health snapshots after the next scheduled run windows
- inspect Redis freshness metadata if needed

## 5. Continue expanding Vercel-native seeding

Current cron layer is only the start. More seeders still need Vercel-native scheduling, on-demand refresh, or relaxed health expectations.
Priority areas based on the latest health output:

- earthquakes
- outages
- sectors
- ETF flows
- climate anomalies
- wildfires
- market quotes
- commodity quotes
- cyber threats
- risk scores / positive geo events
