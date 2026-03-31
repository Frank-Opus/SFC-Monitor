import { jsonResponse } from './_json-response.js';
import { atomicPublish, writeFreshnessMetadata } from '../scripts/_seed-utils.mjs';
import {
  CACHE_TTL,
  CANONICAL_KEY,
  fetchNationalDebt,
  validate,
} from '../scripts/seed-national-debt.mjs';

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (secret && auth === `Bearer ${secret}`) return true;
  return req.headers.get('x-vercel-cron') === '1';
}

export const config = { maxDuration: 60 };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { 'Cache-Control': 'no-store' });
  }
  if (!authorized(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, { 'Cache-Control': 'no-store' });
  }

  try {
    const data = await fetchNationalDebt();
    const publish = await atomicPublish(CANONICAL_KEY, data, validate, CACHE_TTL);
    const count = Array.isArray(data?.entries) ? data.entries.length : 0;

    if (publish.skipped) {
      await writeFreshnessMetadata('economic', 'national-debt', 0, 'imf-weo-2024');
      return jsonResponse({
        ok: true,
        skipped: true,
        count: 0,
        seededAt: data?.seededAt || new Date().toISOString(),
      }, 200, {
        'Cache-Control': 'private, no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
      });
    }

    await writeFreshnessMetadata('economic', 'national-debt', count, 'imf-weo-2024');
    return jsonResponse({
      ok: true,
      skipped: false,
      count,
      seededAt: data?.seededAt || new Date().toISOString(),
      canonicalKey: CANONICAL_KEY,
    }, 200, {
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500, {
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
    });
  }
}
