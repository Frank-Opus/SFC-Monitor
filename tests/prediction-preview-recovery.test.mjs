import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rpcClientSrc = readFileSync(resolve(__dirname, '../src/services/rpc-client.ts'), 'utf-8');
const predictionSrc = readFileSync(resolve(__dirname, '../src/services/prediction/index.ts'), 'utf-8');
const appSrc = readFileSync(resolve(__dirname, '../src/App.ts'), 'utf-8');
const forecastSrc = readFileSync(resolve(__dirname, '../src/services/forecast.ts'), 'utf-8');

describe('prediction preview recovery guards', () => {
  it('keeps RPC clients on a relative base so runtime routing can proxy preview traffic', () => {
    assert.match(rpcClientSrc, /export function getRpcBaseUrl\(\): string \{\s*\/\/ Keep RPC clients on a relative base[\s\S]*return '';\s*\}/);
  });

  it('falls back to bootstrap predictions before surfacing preview prediction failures', () => {
    assert.ok(predictionSrc.includes("toApiUrl('/api/bootstrap?keys=predictions')"), 'Expected bootstrap predictions fallback request');
    assert.ok(predictionSrc.includes('const bootstrap = await fetchBootstrapPredictions();'), 'Expected active bootstrap fallback before RPC failure');
  });

  it('keeps AI forecasts recoverable from bootstrap after initial hydration is consumed', () => {
    assert.ok(forecastSrc.includes("toApiUrl('/api/bootstrap?keys=forecasts')"), 'Expected bootstrap forecasts fallback request');
    assert.ok(forecastSrc.includes('const bootstrapForecasts = await fetchBootstrapForecasts();'), 'Expected forecast bootstrap fallback before RPC-only response');
  });

  it('restores live-webcams for variants where the panel is default-enabled', () => {
    assert.ok(appSrc.includes("const LIVE_WEBCAMS_RESTORE_KEY = 'worldmonitor-live-webcams-restore-v1';"), 'Expected webcam restore migration key');
    assert.ok(appSrc.includes("variantDefaults.has('live-webcams')"), 'Expected webcam restore migration to check variant defaults');
  });

  it('restores AI spotlight panels and protects them from free-tier trimming', () => {
    assert.ok(appSrc.includes("const AI_SPOTLIGHT_RESTORE_KEY = 'worldmonitor-ai-spotlight-restore-v1';"), 'Expected AI spotlight restore migration key');
    assert.ok(appSrc.includes("const AI_SPOTLIGHT_PANELS = ['insights', 'strategic-posture', 'forecast', 'polymarket'] as const;"), 'Expected AI spotlight panel set');
    assert.ok(appSrc.includes("const FREE_TIER_PRIORITY_PANEL_ORDER = ['map', 'live-news', 'live-webcams', ...AI_SPOTLIGHT_PANELS] as const;"), 'Expected free-tier priority ordering to preserve AI panels');
    assert.ok(appSrc.includes("promotePanelsAfterAnchor(order, 'live-news', restorablePanels)"), 'Expected AI panel order promotion near the top of the layout');
  });
});
