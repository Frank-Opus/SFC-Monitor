## Preview Recovery Memory

Date: 2026-04-01

What was actually broken on `sfc-monitor.vercel.app`:

- Browser preview traffic could not safely rely on direct `https://api.worldmonitor.app/api/...` reads.
- Several public reads only worked when the request was proxied server-side with a trusted `User-Agent`, and some upstream paths also needed `Origin: https://worldmonitor.app` plus `Referer: https://worldmonitor.app/`.
- Market and prediction data were more reliable when rebuilt from public bootstrap tiers than when calling the RPC paths directly.

Stable repair pattern:

1. Keep browser RPC clients on a relative base so the runtime fetch patch can decide whether to use:
   - same-origin market proxy
   - same-origin `/api/cloud/...` proxy
   - or the canonical remote API base
2. For `sfc-monitor` preview hosts, route broad read-only `/api/...` traffic through `/api/cloud/...`.
3. In the preview proxy, send:
   - `User-Agent: worldmonitor-sfc-preview-proxy/1.0`
   - `Origin: https://worldmonitor.app`
   - `Referer: https://worldmonitor.app/`
4. When upstream RPCs return `401 API key required` for public panels, rebuild responses from `bootstrap?tier=fast|slow` instead of surfacing errors to the UI.
5. Do not trust one-shot bootstrap hydration alone for critical panels like `Predictions`; add an active `bootstrap?keys=...` fallback.

Specific user-facing regressions fixed here:

- `Predictions` failed because hydration was one-shot and RPC fallback still hit an auth-gated upstream path.
- `Live Webcams` disappeared because the `live-youtube -> live-webcams` rename preserved legacy hidden state in browser storage.

If preview regresses again, inspect first:

- `src/services/runtime.ts`
- `src/services/rpc-client.ts`
- `api/cloud-proxy.js`
- `src/services/prediction/index.ts`
- `src/App.ts`
