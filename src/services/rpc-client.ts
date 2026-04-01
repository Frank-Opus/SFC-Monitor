export function getRpcBaseUrl(): string {
  // Keep RPC clients on a relative base so runtime fetch patching can route
  // browser requests through the correct origin/proxy at request time.
  return '';
}
