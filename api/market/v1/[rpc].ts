export const config = { runtime: 'edge' };

// @ts-expect-error — JS module, no declaration file
import { getCorsHeaders, isDisallowedOrigin } from '../../_cors.js';
import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createMarketServiceRoutes } from '../../../src/generated/server/worldmonitor/market/v1/service_server';
import { marketHandler } from '../../../server/worldmonitor/market/v1/handler';

const UPSTREAM_API_BASE = 'https://api.worldmonitor.app';
const SFC_MONITOR_HOST_PATTERN = /^sfc-monitor(?:-[a-z0-9-]+)*\.vercel\.app$/i;

const gatewayHandler = createDomainGateway(
  createMarketServiceRoutes(marketHandler, serverOptions),
);

function shouldProxyPreviewMarketRequest(req: Request): boolean {
  const url = new URL(req.url);
  return req.method === 'GET' && SFC_MONITOR_HOST_PATTERN.test(url.hostname);
}

function buildProxyHeaders(req: Request): Headers {
  const headers = new Headers();
  headers.set('Accept', req.headers.get('Accept') ?? 'application/json');
  headers.set('User-Agent', req.headers.get('User-Agent') ?? 'worldmonitor-preview-market-proxy/1.0');

  const forwardedHeaderNames = [
    'Authorization',
    'X-WorldMonitor-Key',
    'If-None-Match',
  ];
  for (const headerName of forwardedHeaderNames) {
    const value = req.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

export default async function handler(req: Request): Promise<Response> {
  if (!shouldProxyPreviewMarketRequest(req)) {
    return gatewayHandler(req);
  }

  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = getCorsHeaders(req) as Record<string, string>;
  const upstreamUrl = `${UPSTREAM_API_BASE}${new URL(req.url).pathname}${new URL(req.url).search}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers: buildProxyHeaders(req),
  });

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
