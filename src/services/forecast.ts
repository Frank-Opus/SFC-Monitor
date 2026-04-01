import { ForecastServiceClient } from '@/generated/client/worldmonitor/forecast/v1/service_client';
import type { Forecast } from '@/generated/client/worldmonitor/forecast/v1/service_client';
import { getRpcBaseUrl } from '@/services/rpc-client';
import { getHydratedData } from '@/services/bootstrap';
import { toApiUrl } from '@/services/runtime';

export type { Forecast };

export { escapeHtml } from '@/utils/sanitize';

let _client: ForecastServiceClient | null = null;

function getClient(): ForecastServiceClient {
  if (!_client) {
    _client = new ForecastServiceClient(getRpcBaseUrl(), {
      fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
    });
  }
  return _client;
}

async function fetchBootstrapForecasts(): Promise<Forecast[]> {
  const hydrated = getHydratedData('forecasts') as { predictions?: Forecast[] } | undefined;
  if (hydrated?.predictions?.length) return hydrated.predictions;

  try {
    const resp = await globalThis.fetch(toApiUrl('/api/bootstrap?keys=forecasts'), {
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    const payload = await resp.json() as {
      data?: { forecasts?: { predictions?: Forecast[] } };
    };
    return payload.data?.forecasts?.predictions ?? [];
  } catch {
    return [];
  }
}

export async function fetchForecasts(domain?: string, region?: string): Promise<Forecast[]> {
  const bootstrapForecasts = await fetchBootstrapForecasts();
  if (!domain && !region && bootstrapForecasts.length > 0) {
    return bootstrapForecasts;
  }

  try {
    const resp = await getClient().getForecasts({ domain: domain || '', region: region || '' });
    if (resp.forecasts?.length) return resp.forecasts;
  } catch {
    // Fall through to bootstrap snapshot.
  }

  return bootstrapForecasts;
}

export async function fetchSimulationOutcome(): Promise<string> {
  const resp = await getClient().getSimulationOutcome({ runId: '' });
  return (resp.found && resp.theaterSummariesJson) ? resp.theaterSummariesJson : '';
}
