import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

const originalFetch = globalThis.fetch;

let handler: (req: Request) => Promise<Response>;

describe('market preview proxy', () => {
  beforeEach(async () => {
    const mod = await import(`../api/market/v1/[rpc].ts?t=${Date.now()}`);
    handler = mod.default;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('proxies sfc-monitor market GET requests to api.worldmonitor.app', async () => {
    let forwardedUrl = '';
    let forwardedHeaders: Headers | undefined;
    globalThis.fetch = async (input, init) => {
      forwardedUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      forwardedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({
        tokens: [{ symbol: 'UNI', name: 'Uniswap' }],
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/market/v1/list-defi-tokens', {
      method: 'GET',
      headers: {
        Origin: 'https://sfc-monitor.vercel.app',
        Authorization: 'Bearer preview-token',
        'X-WorldMonitor-Key': 'preview-key',
      },
    }));

    assert.equal(forwardedUrl, 'https://api.worldmonitor.app/api/market/v1/list-defi-tokens');
    assert.equal(forwardedHeaders?.get('Authorization'), 'Bearer preview-token');
    assert.equal(forwardedHeaders?.get('X-WorldMonitor-Key'), 'preview-key');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://sfc-monitor.vercel.app');
    const body = await res.json() as { tokens: Array<{ symbol: string }> };
    assert.equal(body.tokens[0]?.symbol, 'UNI');
  });

  it('rejects disallowed origins before proxying preview requests', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response('{}', { status: 200 });
    };

    const res = await handler(new Request('https://sfc-monitor.vercel.app/api/market/v1/list-market-quotes?symbols=AAPL', {
      method: 'GET',
      headers: {
        Origin: 'https://evil.example.com',
      },
    }));

    assert.equal(fetchCalled, false);
    assert.equal(res.status, 403);
  });
});
