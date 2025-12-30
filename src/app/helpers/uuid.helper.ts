/**
 * Generates a UUID v4.
 * Uses crypto.randomUUID() when available (secure contexts),
 * falls back to a manual implementation for non-secure contexts.
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
}
