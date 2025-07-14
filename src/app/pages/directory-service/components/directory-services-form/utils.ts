export function hasDeepNonNullValue(obj: unknown): boolean {
  if (obj === null || obj === undefined) {
    return false;
  }

  if (typeof obj !== 'object') {
    return true;
  }

  for (const value of Object.values(obj)) {
    if (hasDeepNonNullValue(value)) {
      return true;
    }
  }

  return false;
}
