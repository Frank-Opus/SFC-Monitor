# Next Steps

## 1. Finish the two remaining CI blockers
Apply / verify these exact fixes:
- `api/cron-seed-national-debt.ts`
  - remove the unused `@ts-expect-error` above the `_seed-utils.mjs` import
  - keep only the necessary suppression for `seed-national-debt.mjs` if TS still requires it
- `tests/mcp-proxy.test.mjs`
  - rename the unused fetch parameter `url` -> `_url` in the SSE content-type parsing test

Then commit and push.

## 2. Wait for GitHub checks to turn green
Target checks:
- `Test`
- `Typecheck`
- `Lint Code`

## 3. Verify Vercel production updates off old commit `84d1da4a`
Once production switches to the newer commit, recheck:
- `https://sfc-monitor.vercel.app/api/cron-warm?group=fast`
- `https://sfc-monitor.vercel.app/api/cron-seed-national-debt`

Expected result: no more `404`.

## 4. Manually warm/seed once production has the routes
Run or request:
- `/api/cron-warm?group=fast`
- `/api/cron-warm?group=hourly`
- `/api/cron-seed-national-debt`

Then recheck:
- `/api/health?compact=1`
- `/api/seed-health`

## 5. Continue expanding Vercel-native seeding
Current cron layer is only the start. More seeders still need Vercel-native scheduling or warm paths.
Priority areas based on current health output:
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
