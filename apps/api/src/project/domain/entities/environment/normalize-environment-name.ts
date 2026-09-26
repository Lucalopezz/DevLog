// The same value is used for preflight duplicate checks and the database unique key.
export function normalizeEnvironmentName(name: string): string {
  return typeof name === 'string' ? name.trim().toLocaleLowerCase('en-US') : '';
}
