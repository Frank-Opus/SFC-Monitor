import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

const originalFetch = globalThis.fetch;

let handler;

describe('cloud preview proxy', () => {
  beforeEach(async () => {
    const mod = await import(`../api/cloud-proxy.js?t=${Date.now()}`);
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
    assert.equal(forwardedHeaders?.get('Origin'), 'https://worldmonitor.app');
    assert.equal(forwardedHeaders?.get('Referer'), 'https://worldmonitor.app/');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://sfc-monitor.vercel.app');
  });

  it('accepts rewritten query-path entrypoints for nested cloud RPC paths', async () => {
    let forwardedUrl = '';
    globalThis.fetch = async (input) => {
      forwardedUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/cloud-proxy?path=prediction/v1/list-prediction-markets&category=geopolitics&page_size=5&cursor=', {
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
      },
    }));

    assert.equal(forwardedUrl, 'https://api.worldmonitor.app/api/prediction/v1/list-prediction-markets?category=geopolitics&page_size=5&cursor=');
    assert.equal(res.status, 200);
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
      if (url === 'https://api.worldmonitor.app/api/bootstrap?keys=progressData%2CmarketQuotes') {
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

  it('rebuilds prediction markets from bootstrap when upstream RPC requires auth', async () => {
    const calls = [];
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      calls.push({ url, headers: new Headers(init?.headers) });

      if (url === 'https://api.worldmonitor.app/api/prediction/v1/list-prediction-markets?category=geopolitics&pageSize=10&cursor=') {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === 'https://api.worldmonitor.app/api/bootstrap?tier=fast') {
        return new Response(JSON.stringify({
          data: {
            predictions: {
              geopolitical: [
                { title: 'Test market', yesPrice: 62, volume: 120000, url: 'https://polymarket.com/test-market', endDate: '2099-01-01T00:00:00.000Z', source: 'polymarket' },
              ],
            },
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected URL ${url}`);
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/cloud/prediction/v1/list-prediction-markets?category=geopolitics&pageSize=10&cursor=', {
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
      },
    }));

    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.headers.get('Origin'), 'https://worldmonitor.app');
    assert.equal(calls[0]?.headers.get('Referer'), 'https://worldmonitor.app/');
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.markets[0].title, 'Test market');
    assert.equal(body.markets[0].yesPrice, 0.62);
    assert.equal(body.markets[0].source, 'MARKET_SOURCE_POLYMARKET');
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
