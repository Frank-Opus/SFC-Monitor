export const config = { runtime: 'edge' };

// @ts-expect-error — JS module, no declaration file
import { getCorsHeaders, isDisallowedOrigin } from '../../_cors.js';
import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createMarketServiceRoutes } from '../../../src/generated/server/worldmonitor/market/v1/service_server';
import { marketHandler } from '../../../server/worldmonitor/market/v1/handler';

const UPSTREAM_API_BASE = 'https://api.worldmonitor.app';
const UPSTREAM_BOOTSTRAP_URL = `${UPSTREAM_API_BASE}/api/bootstrap`;
const SFC_MONITOR_HOST_PATTERN = /^sfc-monitor(?:-[a-z0-9-]+)*\.vercel\.app$/i;
const FAST_BOOTSTRAP_RPCS = new Set([
  'list-market-quotes',
  'list-commodity-quotes',
]);
const SLOW_BOOTSTRAP_RPCS = new Set([
  'list-crypto-quotes',
  'list-crypto-sectors',
  'list-defi-tokens',
  'list-ai-tokens',
  'list-other-tokens',
  'get-sector-summary',
  'list-stablecoin-markets',
  'list-etf-flows',
  'list-gulf-quotes',
  'get-fear-greed-index',
]);

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

function getBootstrapTierForRequest(req: Request): 'fast' | 'slow' | null {
  const rpc = new URL(req.url).pathname.split('/').pop() ?? '';
  if (FAST_BOOTSTRAP_RPCS.has(rpc)) return 'fast';
  if (SLOW_BOOTSTRAP_RPCS.has(rpc)) return 'slow';
  return null;
}

function parseRepeatedQuery(url: URL, key: string): string[] {
  return url.searchParams.getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

function filterQuotesBySymbol<T extends { symbol?: string }>(quotes: T[], symbols: string[]): T[] {
  if (symbols.length === 0) {
    return quotes;
  }

  const symbolSet = new Set(symbols.map((symbol) => symbol.toUpperCase()));
  return quotes.filter((quote) => symbolSet.has(String(quote.symbol ?? '').toUpperCase()));
}

function normalizeToken(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    name: String(raw.name ?? ''),
    symbol: String(raw.symbol ?? ''),
    price: Number(raw.price ?? 0),
    change: Number(raw.change ?? raw.change24h ?? 0),
    change7d: Number(raw.change7d ?? 0),
    sparkline: Array.isArray(raw.sparkline) ? raw.sparkline : [],
  };
}

function buildBootstrapPayload(req: Request, bootstrapJson: any): Record<string, unknown> | null {
  const url = new URL(req.url);
  const rpc = url.pathname.split('/').pop() ?? '';
  const data = bootstrapJson?.data ?? {};

  switch (rpc) {
    case 'list-market-quotes': {
      const base = data.marketQuotes ?? { quotes: [], finnhubSkipped: false, skipReason: '', rateLimited: false };
      const symbols = parseRepeatedQuery(url, 'symbols');
      return {
        ...base,
        quotes: filterQuotesBySymbol(Array.isArray(base.quotes) ? base.quotes : [], symbols),
      };
    }
    case 'list-commodity-quotes': {
      const base = data.commodityQuotes ?? { quotes: [] };
      const symbols = parseRepeatedQuery(url, 'symbols');
      return {
        ...base,
        quotes: filterQuotesBySymbol(Array.isArray(base.quotes) ? base.quotes : [], symbols),
      };
    }
    case 'list-crypto-quotes': {
      const base = data.cryptoQuotes ?? { quotes: [] };
      return {
        ...base,
        quotes: Array.isArray(base.quotes) ? base.quotes : [],
      };
    }
    case 'list-crypto-sectors':
      return data.cryptoSectors ?? { sectors: [] };
    case 'list-defi-tokens':
      return {
        tokens: Array.isArray(data.defiTokens?.tokens)
          ? data.defiTokens.tokens.map((token: Record<string, unknown>) => normalizeToken(token))
          : [],
      };
    case 'list-ai-tokens':
      return {
        tokens: Array.isArray(data.aiTokens?.tokens)
          ? data.aiTokens.tokens.map((token: Record<string, unknown>) => normalizeToken(token))
          : [],
      };
    case 'list-other-tokens':
      return {
        tokens: Array.isArray(data.otherTokens?.tokens)
          ? data.otherTokens.tokens.map((token: Record<string, unknown>) => normalizeToken(token))
          : [],
      };
    case 'get-sector-summary':
      return data.sectors ?? { sectors: [] };
    case 'list-stablecoin-markets':
      return data.stablecoinMarkets ?? {
        timestamp: '',
        summary: {
          totalMarketCap: 0,
          totalVolume24h: 0,
          coinCount: 0,
          depeggedCount: 0,
          healthStatus: 'UNAVAILABLE',
        },
        stablecoins: [],
      };
    case 'list-etf-flows':
      return data.etfFlows ?? {
        timestamp: '',
        summary: {
          etfCount: 0,
          totalVolume: 0,
          totalEstFlow: 0,
          netDirection: 'NET_FLAT',
          inflowCount: 0,
          outflowCount: 0,
        },
        etfs: [],
      };
    case 'list-gulf-quotes':
      return data.gulfQuotes ?? { quotes: [], rateLimited: false };
    case 'get-fear-greed-index':
      return data.fearGreedIndex ?? {
        timestamp: '',
        composite: { score: 0, label: 'Unavailable', previous: 0 },
        categories: {},
      };
    default:
      return null;
  }
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
  const bootstrapTier = getBootstrapTierForRequest(req);
  if (!bootstrapTier) {
    return gatewayHandler(req);
  }

  const upstreamUrl = `${UPSTREAM_BOOTSTRAP_URL}?tier=${bootstrapTier}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers: buildProxyHeaders(req),
  });
  const upstreamJson = await upstreamResponse.json();
  const payload = buildBootstrapPayload(req, upstreamJson);
  if (!payload) {
    return gatewayHandler(req);
  }

  const headers = new Headers(upstreamResponse.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(JSON.stringify(payload), {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}
