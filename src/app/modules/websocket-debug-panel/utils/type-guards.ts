/**
 * Type guard functions for WebSocket Debug Panel
 */

export function isValidDelay(value: unknown): value is number {
  if (typeof value === 'number') {
    return !Number.isNaN(value) && value >= 0;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed >= 0;
  }

  return false;
}

export function parseDelay(value: unknown, defaultValue = 2000): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? defaultValue : Math.max(0, value);
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  }

  return defaultValue;
}

export function isJsonString(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function safeJsonParse<T = unknown>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown, indent = 2): string {
  if (value === undefined) {
    return 'undefined';
  }

  try {
    const result = JSON.stringify(value, null, indent);
    // JSON.stringify returns undefined for functions and symbols
    return result === undefined ? 'undefined' : result;
  } catch {
    return typeof value === 'string' ? value : String(value);
  }
}
