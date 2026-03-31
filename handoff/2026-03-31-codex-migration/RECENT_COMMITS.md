# Recent Commits

Newest first.

- `abaa9d7b` - `unblock cron deployment checks`
  - local work focused on clearing final CI blockers
- `32b6d22d` - `fix cron typecheck and lint`
  - added `api/types.d.ts`; cleared some lint issues
- `86d0d5bb` - `fix cron CI compatibility`
  - moved new cron routes from `.js` to `.ts`; fixed shared-relay lint issue
- `ad5dce9a` - `add vercel cron warmers`
  - added Vercel cron routes and initial `vercel.json` cron schedules
- `84d1da4a` - `tune health thresholds and fix smart poll lint`
  - this is still the latest commit actually deployed to Vercel production
- `1062ed8a` - `fix seed health status and lint`
  - made `seed-health` return 200 for degraded status rather than pretending the endpoint itself is down
- `2e3f3b36` - `redeploy with verified api env`
- `959e560c` - `fix CI LLM provider expectations`
- `54cb8750` - `fix risk seed health metadata key`
- `1d06bfe2` - `disable CDN caching for seed health`
- `fee3688a` - `disable CDN caching for public finance RPC endpoints`
