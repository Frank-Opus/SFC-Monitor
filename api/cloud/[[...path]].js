import { getCorsHeaders, isDisallowedOrigin } from '../_cors.js';

export const config = { runtime: 'edge' };

const UPSTREAM_API_BASE = 'https://api.worldmonitor.app';
const PROXY_PREFIX = '/api/cloud';
const SFC_MONITOR_HOST_PATTERN = /^sfc-monitor(?:-[a-z0-9-]+)*\.vercel\.app$/i;
const ALLOWED_PROXY_PATH_PATTERN = /^\/api\/(?:[^/]+\/v1\/[^/]+|bootstrap|polymarket|ais-snapshot|geo|gpsjam|reverse-geocode|satellites|youtube\/live|opensky|military-flights|oref-alerts|telegram-feed|supply-chain\/hormuz-tracker|health|seed-health)$/;
const PREMIUM_RPC_PATHS = new Set([
  '/api/market/v1/analyze-stock',
  '/api/market/v1/get-stock-analysis-history',
  '/api/market/v1/backtest-stock',
  '/api/market/v1/list-stored-stock-backtests',
]);

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function extractUpstreamPath(url) {
  if (!url.pathname.startsWith(PROXY_PREFIX)) {
    return '';
  }

  const suffix = url.pathname.slice(PROXY_PREFIX.length);
  return suffix ? `/api${suffix}` : '';
}

function isAllowedPreviewHost(hostname) {
  return SFC_MONITOR_HOST_PATTERN.test(hostname);
}

function isAllowedUpstreamPath(pathname) {
  return Boolean(pathname)
    && ALLOWED_PROXY_PATH_PATTERN.test(pathname)
    && !PREMIUM_RPC_PATHS.has(pathname);
}

function buildUpstreamHeaders(req) {
  const headers = new Headers();
  headers.set('Accept', req.headers.get('Accept') || 'application/json');
  headers.set('User-Agent', req.headers.get('User-Agent') || 'worldmonitor-sfc-preview-proxy/1.0');

  const forwardedHeaderNames = [
    'Accept-Language',
    'Authorization',
    'Content-Type',
    'If-None-Match',
    'X-WorldMonitor-Key',
  ];
  for (const headerName of forwardedHeaderNames) {
    const value = req.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function fetchBootstrapTier(req, tier) {
  const response = await fetch(`${UPSTREAM_API_BASE}/api/bootstrap?tier=${tier}`, {
    method: 'GET',
    headers: buildUpstreamHeaders(req),
  });
  if (!response.ok) {
    throw new Error(`bootstrap ${tier} failed: ${response.status}`);
  }
  return {
    response,
    json: await response.json(),
  };
}

function mergeHeaders(...headerSets) {
  const merged = new Headers();
  for (const headerSet of headerSets) {
    if (!headerSet) continue;
    for (const [key, value] of headerSet.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

async function buildBootstrapKeysFallback(req, requestUrl, corsHeaders) {
  const requestedKeys = (requestUrl.searchParams.get('keys') || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  if (requestedKeys.length === 0) {
    return json({ error: 'API key required' }, 401, corsHeaders);
  }

  const [fast, slow] = await Promise.all([
    fetchBootstrapTier(req, 'fast'),
    fetchBootstrapTier(req, 'slow'),
  ]);

  const mergedData = {
    ...(fast.json?.data || {}),
    ...(slow.json?.data || {}),
  };
  const data = {};
  const missing = [];
  for (const key of requestedKeys) {
    if (key in mergedData) {
      data[key] = mergedData[key];
    } else {
      missing.push(key);
    }
  }

  const headers = mergeHeaders(fast.response.headers, slow.response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  headers.set('Cache-Control', 'no-store');
  headers.set('CDN-Cache-Control', 'no-store');

  return json({ data, missing }, 200, Object.fromEntries(headers.entries()));
}

export default async function handler(req) {
  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = getCorsHeaders(req, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const requestUrl = new URL(req.url);
  if (!isAllowedPreviewHost(requestUrl.hostname)) {
    return json({ error: 'Not found' }, 404, corsHeaders);
  }

  const upstreamPath = extractUpstreamPath(requestUrl);
  if (!isAllowedUpstreamPath(upstreamPath)) {
    return json({ error: 'Not found' }, 404, corsHeaders);
  }

  const upstreamUrl = `${UPSTREAM_API_BASE}${upstreamPath}${requestUrl.search}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: req.method,
    headers: buildUpstreamHeaders(req),
    body: req.method === 'POST' ? await req.text() : undefined,
  });

  if (
    upstreamResponse.status === 401
    && upstreamPath === '/api/bootstrap'
    && requestUrl.searchParams.has('keys')
    && req.method === 'GET'
  ) {
    return buildBootstrapKeysFallback(req, requestUrl, corsHeaders);
  }

  const headers = new Headers(upstreamResponse.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}
