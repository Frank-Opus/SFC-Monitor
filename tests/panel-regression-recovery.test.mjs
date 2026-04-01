import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const panelsSrc = readFileSync(resolve(__dirname, '../src/config/panels.ts'), 'utf-8');
const fullVariantSrc = readFileSync(resolve(__dirname, '../src/config/variants/full.ts'), 'utf-8');
const panelLayoutSrc = readFileSync(resolve(__dirname, '../src/app/panel-layout.ts'), 'utf-8');
const dataLoaderSrc = readFileSync(resolve(__dirname, '../src/app/data-loader.ts'), 'utf-8');
const componentIndexSrc = readFileSync(resolve(__dirname, '../src/components/index.ts'), 'utf-8');

describe('panel regression recovery', () => {
  it('restores the deleted satellite imagery panel wiring', () => {
    assert.ok(panelsSrc.includes("'satellite-imagery': { name: 'Satellite Imagery', enabled: true, priority: 2 }"), 'Expected satellite imagery panel in the unified registry');
    assert.ok(fullVariantSrc.includes("'satellite-imagery': { name: 'Satellite Imagery', enabled: true, priority: 2 }"), 'Expected satellite imagery panel in the full variant defaults');
    assert.ok(componentIndexSrc.includes("export * from './SatelliteImageryPanel';"), 'Expected satellite imagery panel export');
    assert.ok(panelLayoutSrc.includes("this.createPanel('satellite-imagery', () => new SatelliteImageryPanel())"), 'Expected panel layout to create the satellite imagery panel');
    assert.ok(dataLoaderSrc.includes("this.ctx.panels['satellite-imagery']"), 'Expected data loader to update the satellite imagery panel');
  });

  it('keeps finance market panel category entries for the premium analysis panels', () => {
    assert.ok(panelsSrc.includes("panelKeys: ['markets', 'stock-analysis', 'stock-backtest', 'daily-market-brief', 'market-implications', 'markets-news', 'heatmap', 'macro-signals', 'analysis', 'polymarket']"), 'Expected finance markets category to include premium market panels');
  });
});
