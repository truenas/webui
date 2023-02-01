/**
 * Given an object, returns boolean keys that are true.
 * E.g. {
 *  digital_signature: true;
 *  content_commitment: false;
 * }
 * becomes
 * ['digital_signature']
 */
export function extensionsToSelectValues(extensions: Record<string, boolean>): string[] {
  return Object.entries(extensions)
    .filter(([, value]) => value)
    .map(([key]) => key);
}
