import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runtimeSrc = readFileSync(resolve(__dirname, '../src/services/runtime.ts'), 'utf-8');
const variantSrc = readFileSync(resolve(__dirname, '../src/config/variant.ts'), 'utf-8');

describe('runtime env guards', () => {
  it('reads import.meta.env through a guarded ENV wrapper', () => {
    assert.match(
      runtimeSrc,
      /const ENV = \(\(\) => \{\s*try \{\s*return import\.meta\.env \?\? \{\};\s*\} catch \{\s*return \{\} as Record<string, string \| undefined>;/s,
    );
  });

  it('reuses the guarded ENV wrapper for runtime env lookups', () => {
    assert.ok(runtimeSrc.includes('const WS_API_URL = ENV.VITE_WS_API_URL || \'\''), 'WS API URL should read from ENV');
    assert.ok(runtimeSrc.includes('const FORCE_DESKTOP_RUNTIME = ENV.VITE_DESKTOP_RUNTIME === \'1\''), 'Desktop runtime flag should read from ENV');
    assert.ok(runtimeSrc.includes('const configuredBaseUrl = ENV.VITE_TAURI_API_BASE_URL;'), 'Tauri API base should read from ENV');
    assert.ok(runtimeSrc.includes('const configuredRemoteBase = ENV.VITE_TAURI_REMOTE_API_BASE_URL;'), 'Remote API base should read from ENV');
    assert.ok(runtimeSrc.includes('...extractHostnames(WS_API_URL, ENV.VITE_WS_RELAY_URL)'), 'Relay host extraction should read from ENV');
  });

  it('treats the deployed sfc-monitor Vercel host as a trusted web host', () => {
    assert.ok(runtimeSrc.includes('const SFC_MONITOR_HOST_PATTERN = /^sfc-monitor(?:-[a-z0-9-]+)*\\.vercel\\.app$/i;'), 'Expected shared sfc-monitor host pattern');
    assert.ok(runtimeSrc.includes('|| SFC_MONITOR_HOST_PATTERN.test(hostname);'), 'Expected trusted web host check to reuse shared sfc-monitor pattern');
  });

  it('keeps sfc-monitor market requests on same-origin so preview can proxy them server-side', () => {
    assert.ok(runtimeSrc.includes("const SAME_ORIGIN_MARKET_PROXY_PATTERN = /^\\/api\\/market\\/v1\\//;"), 'Expected same-origin market proxy pattern');
    assert.ok(runtimeSrc.includes('function shouldUseSameOriginMarketProxy(pathWithQuery: string): boolean {'), 'Expected same-origin market proxy helper');
  });
});

describe('variant env guards', () => {
  it('computes the build variant through a guarded import.meta.env access', () => {
    assert.match(
      variantSrc,
      /const buildVariant = \(\(\) => \{\s*try \{\s*return import\.meta\.env\?\.VITE_VARIANT \|\| 'full';\s*\} catch \{\s*return 'full';\s*\}\s*\}\)\(\);/s,
    );
  });

  it('reuses buildVariant for SSR and local variant fallback paths', () => {
    const buildVariantUses = variantSrc.match(/buildVariant/g) ?? [];
    assert.ok(buildVariantUses.length >= 3, `Expected buildVariant to be reused across variant resolution, got ${buildVariantUses.length}`);
    assert.ok(variantSrc.includes("if (typeof window === 'undefined') return buildVariant;"), 'SSR should fall back to buildVariant');
    assert.ok(variantSrc.includes("return getStoredVariant() || buildVariant;"), 'Tauri should fall back to buildVariant after stored variant');
    assert.ok(variantSrc.includes("return getUrlVariant() || getStoredVariant() || buildVariant;"), 'localhost should eventually fall back to buildVariant');
  });
});
