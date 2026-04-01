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
const zhLocaleSrc = readFileSync(resolve(__dirname, '../src/locales/zh.json'), 'utf-8');

describe('panel regression recovery', () => {
  it('restores the deleted satellite imagery panel wiring', () => {
    assert.ok(panelsSrc.includes("'satellite-imagery': { name: 'Satellite Imagery', enabled: true, priority: 2 }"), 'Expected satellite imagery panel in the unified registry');
    assert.ok(fullVariantSrc.includes("'satellite-imagery': { name: 'Satellite Imagery', enabled: true, priority: 2 }"), 'Expected satellite imagery panel in the full variant defaults');
    assert.ok(componentIndexSrc.includes("export * from './SatelliteImageryPanel';"), 'Expected satellite imagery panel export');
    assert.ok(panelLayoutSrc.includes("this.createPanel('satellite-imagery', () => new SatelliteImageryPanel())"), 'Expected panel layout to create the satellite imagery panel');
    assert.ok(dataLoaderSrc.includes("this.ctx.panels['satellite-imagery']"), 'Expected data loader to update the satellite imagery panel');
  });

  it('keeps live webcams and SFC-Agent AI panels promoted in the layout defaults', () => {
    assert.ok(fullVariantSrc.includes("'live-webcams': { name: 'Live Webcams', enabled: true, priority: 1 }"), 'Expected full variant defaults to include live webcams');
    assert.ok(fullVariantSrc.includes("insights: { name: 'SFC-Agent AI Insights', enabled: true, priority: 1 }"), 'Expected full variant defaults to include SFC-Agent AI insights');
    assert.ok(panelLayoutSrc.includes("const SFC_AGENT_SPOTLIGHT_PANELS = ['live-webcams', 'insights', 'strategic-posture', 'forecast', 'polymarket'] as const;"), 'Expected spotlight panel promotion set in layout manager');
    assert.ok(panelLayoutSrc.includes("allOrder = promotePanelsAfterAnchor(allOrder, 'live-news', SFC_AGENT_SPOTLIGHT_PANELS);"), 'Expected unsaved layout defaults to promote live webcams and AI panels');
  });

  it('keeps finance market panel category entries for the premium analysis panels', () => {
    assert.ok(panelsSrc.includes("panelKeys: ['markets', 'stock-analysis', 'stock-backtest', 'daily-market-brief', 'market-implications', 'markets-news', 'heatmap', 'macro-signals', 'analysis', 'polymarket']"), 'Expected finance markets category to include premium market panels');
  });

  it('keeps SFC-Agent spotlight panels branded and promoted in the default layout', () => {
    assert.ok(panelLayoutSrc.includes("const SFC_AGENT_SPOTLIGHT_PANELS = ['live-webcams', 'insights', 'strategic-posture', 'forecast', 'polymarket'] as const;"), 'Expected spotlight panel set in layout manager');
    assert.ok(panelLayoutSrc.includes("const ULTRAWIDE_WEBCAM_BOTTOM_PANELS = ['live-webcams'] as const;"), 'Expected webcam-only ultrawide bottom set in layout manager');
    assert.ok(panelLayoutSrc.includes("allOrder = promotePanelsAfterAnchor(allOrder, 'live-news', SFC_AGENT_SPOTLIGHT_PANELS);"), 'Expected layout manager to keep spotlight panels near the top');
    assert.ok(panelLayoutSrc.includes("return new Set(ULTRAWIDE_WEBCAM_BOTTOM_PANELS);"), 'Expected fresh layouts to place only live webcams in the map bottom zone');
    assert.ok(panelsSrc.includes("insights: { name: 'SFC-Agent AI Insights', enabled: true, priority: 1 }"), 'Expected SFC-Agent AI Insights in registry');
    assert.ok(panelsSrc.includes("polymarket: { name: 'SFC-Agent AI Predictions', enabled: true, priority: 1 }"), 'Expected SFC-Agent AI Predictions in registry');
  });

  it('keeps Chinese AI panel titles branded with the SFC-Agent prefix', () => {
    assert.ok(zhLocaleSrc.includes('"insights": "SFC-Agent AI洞察"'), 'Expected Chinese insights title to include SFC-Agent prefix');
    assert.ok(zhLocaleSrc.includes('"strategicPosture": "SFC-Agent AI战略态势"'), 'Expected Chinese strategic posture title to include SFC-Agent prefix');
    assert.ok(zhLocaleSrc.includes('"polymarket": "SFC-Agent AI预测"'), 'Expected Chinese predictions title to include SFC-Agent prefix');
    assert.ok(zhLocaleSrc.includes('"forecast": "SFC-Agent AI预测研判"'), 'Expected Chinese forecast title to include SFC-Agent prefix');
  });

  it('keeps regional news panels and subsea cables enabled in the full defaults', () => {
    assert.ok(fullVariantSrc.includes("politics: { name: 'World News', enabled: true, priority: 1 }"), 'Expected world news panel in full defaults');
    assert.ok(fullVariantSrc.includes("us: { name: 'United States', enabled: true, priority: 1 }"), 'Expected US panel in full defaults');
    assert.ok(fullVariantSrc.includes("europe: { name: 'Europe', enabled: true, priority: 1 }"), 'Expected Europe panel in full defaults');
    assert.ok(fullVariantSrc.includes("middleeast: { name: 'Middle East', enabled: true, priority: 1 }"), 'Expected Middle East panel in full defaults');
    assert.ok(fullVariantSrc.includes("africa: { name: 'Africa', enabled: true, priority: 1 }"), 'Expected Africa panel in full defaults');
    assert.ok(fullVariantSrc.includes("latam: { name: 'Latin America', enabled: true, priority: 1 }"), 'Expected Latin America panel in full defaults');
    assert.ok(fullVariantSrc.includes("asia: { name: 'Asia-Pacific', enabled: true, priority: 1 }"), 'Expected Asia-Pacific panel in full defaults');
    assert.ok(panelLayoutSrc.includes("this.createNewsPanel('politics', 'panels.politics');"), 'Expected world news panel wiring');
    assert.ok(panelLayoutSrc.includes("this.createNewsPanel('middleeast', 'panels.middleeast');"), 'Expected Middle East panel wiring');
    assert.ok(panelLayoutSrc.includes("this.createNewsPanel('latam', 'panels.latam');"), 'Expected Latin America panel wiring');
    assert.ok(panelLayoutSrc.includes("this.createNewsPanel('asia', 'panels.asia');"), 'Expected Asia-Pacific panel wiring');
    assert.ok(panelLayoutSrc.includes("const REGIONAL_NEWS_PANELS = ['politics', 'us', 'europe', 'middleeast', 'africa', 'latam', 'asia'] as const;"), 'Expected regional news promotion set in layout manager');
    assert.ok(panelLayoutSrc.includes("allOrder = promotePanelsAfterAnchor(allOrder, 'polymarket', REGIONAL_NEWS_PANELS);"), 'Expected fresh layouts to place regional news below the AI spotlight block');
    assert.match(panelsSrc, /const FULL_MAP_LAYERS: MapLayers = \{[\s\S]*?\bcables: true,/u, 'Expected unified full desktop map defaults to enable subsea cables');
    assert.match(panelsSrc, /const FULL_MOBILE_MAP_LAYERS: MapLayers = \{[\s\S]*?\bcables: true,/u, 'Expected unified full mobile map defaults to enable subsea cables');
    assert.match(fullVariantSrc, /export const DEFAULT_MAP_LAYERS: MapLayers = \{[\s\S]*?\bcables: true,/u, 'Expected dedicated full desktop defaults to enable subsea cables');
    assert.match(fullVariantSrc, /export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = \{[\s\S]*?\bcables: true,/u, 'Expected dedicated full mobile defaults to enable subsea cables');
  });
});
