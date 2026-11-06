/**
 * Returns the keys whose value is true, e.g. `{ digital_signature: true, content_commitment: false }`
 * → `['digital_signature']`.
 */
export function extensionsToSelectValues(extensions: Record<string, boolean>): string[] {
  return Object.entries(extensions)
    .filter(([, value]) => value)
    .map(([key]) => key);
}
