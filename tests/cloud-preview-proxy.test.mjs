import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

const originalFetch = globalThis.fetch;

let handler;

describe('cloud preview proxy', () => {
  beforeEach(async () => {
    const mod = await import(`../api/cloud/[[...path]].js?t=${Date.now()}`);
    handler = mod.default;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('proxies allowed sfc preview requests to api.worldmonitor.app with a trusted origin header', async () => {
    let forwardedUrl = '';
    let forwardedHeaders;
    globalThis.fetch = async (input, init) => {
      forwardedUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      forwardedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/cloud/news/v1/list-feed-digest?variant=full&lang=en', {
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
      },
    }));

    assert.equal(forwardedUrl, 'https://api.worldmonitor.app/api/news/v1/list-feed-digest?variant=full&lang=en');
    assert.equal(forwardedHeaders?.get('Origin'), null);
    assert.equal(forwardedHeaders?.get('Referer'), null);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://sfc-monitor.vercel.app');
  });

  it('rebuilds bootstrap key requests from fast and slow tier fallbacks when upstream keys path requires auth', async () => {
    const calls = [];
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      calls.push({ url, headers: new Headers(init?.headers) });
      if (url === 'https://api.worldmonitor.app/api/bootstrap?keys=progressData,marketQuotes') {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === 'https://api.worldmonitor.app/api/bootstrap?tier=fast') {
        return new Response(JSON.stringify({ data: { marketQuotes: { quotes: [{ symbol: 'AAPL' }] } } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === 'https://api.worldmonitor.app/api/bootstrap?tier=slow') {
        return new Response(JSON.stringify({ data: { progressData: { countries: [] } } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected URL ${url}`);
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/cloud/bootstrap?keys=progressData,marketQuotes', {
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
      },
    }));

    assert.equal(calls.length, 3);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.marketQuotes.quotes[0].symbol, 'AAPL');
    assert.deepEqual(body.data.progressData.countries, []);
  });

  it('refuses premium market paths through the generic preview proxy', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response('{}', { status: 200 });
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/cloud/market/v1/analyze-stock?symbol=AAPL', {
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
      },
    }));

    assert.equal(fetchCalled, false);
    assert.equal(res.status, 404);
  });
});
