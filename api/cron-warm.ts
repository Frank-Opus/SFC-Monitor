import { jsonResponse } from './_json-response.js';

const GROUPS: Record<string, string[]> = {
  fast: [
    '/api/infrastructure/v1/list-service-statuses',
    '/api/infrastructure/v1/get-cable-health',
    '/api/infrastructure/v1/list-temporal-anomalies',
    '/api/intelligence/v1/get-risk-scores',
    '/api/aviation/v1/list-airport-delays',
    '/api/supply-chain/v1/get-chokepoint-status',
  ],
  hourly: [
    '/api/intelligence/v1/list-security-advisories',
    '/api/intelligence/v1/list-gps-interference',
    '/api/intelligence/v1/list-satellites',
    '/api/research/v1/list-tech-events',
    '/api/market/v1/list-earnings-calendar',
    '/api/economic/v1/get-economic-calendar',
  ],
};

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (secret && auth === `Bearer ${secret}`) return true;
  return req.headers.get('x-vercel-cron') === '1';
}

async function warmEndpoint(origin: string, path: string) {
  const startedAt = Date.now();
  const url = `${origin}${path}`;
  try {
    const resp = await fetch(url, {
      headers: {
        Origin: origin,
        Referer: `${origin}/`,
        'User-Agent': 'vercel-cron/1.0',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await resp.text();
    return {
      path,
      ok: resp.ok,
      status: resp.status,
      durationMs: Date.now() - startedAt,
      bodyPreview: text.slice(0, 160),
    };
  } catch (error) {
    return {
      path,
      ok: false,
      status: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const config = { maxDuration: 60 };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { 'Cache-Control': 'no-store' });
  }
  if (!authorized(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, { 'Cache-Control': 'no-store' });
  }

  const url = new URL(req.url);
  const group = url.searchParams.get('group') || 'fast';
  const paths = GROUPS[group];
  if (!paths) {
    return jsonResponse({ error: `Unknown group: ${group}` }, 400, { 'Cache-Control': 'no-store' });
  }

  const origin = url.origin;
  const results = [];
  for (const path of paths) {
    results.push(await warmEndpoint(origin, path));
  }

  const okCount = results.filter((result) => result.ok).length;
  const status = okCount === results.length ? 200 : 207;
  return jsonResponse({
    group,
    origin,
    okCount,
    total: results.length,
    results,
    warmedAt: new Date().toISOString(),
  }, status, {
    'Cache-Control': 'private, no-store, max-age=0',
    'CDN-Cache-Control': 'no-store',
  });
}
