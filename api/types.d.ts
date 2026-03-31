declare module './_json-response.js' {
  export function jsonResponse(body: unknown, status?: number, headers?: Record<string, string>): Response;
}

declare module '../scripts/_seed-utils.mjs' {
  export function atomicPublish(canonicalKey: string, data: unknown, validateFn?: ((data: unknown) => boolean) | undefined, ttlSeconds?: number | undefined): Promise<{ payloadBytes: number; skipped?: boolean }>;
  export function writeFreshnessMetadata(domain: string, resource: string, count: number, source?: string): Promise<unknown>;
}

declare module '../scripts/seed-national-debt.mjs' {
  export const CACHE_TTL: number;
  export const CANONICAL_KEY: string;
  export function fetchNationalDebt(): Promise<{ entries: unknown[]; seededAt: string }>;
  export function validate(data: unknown): boolean;
}
