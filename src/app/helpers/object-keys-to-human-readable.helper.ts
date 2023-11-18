export function toHumanReadableKey(str: string): string {
  return str
    // Insert a space before any uppercase letters in the middle of words
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace any underscores or dashes with spaces
    .replace(/[_-]+/g, ' ')
    // Trim whitespace at the start and end
    .trim()
    // Capitalize the first letter of each word
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export function convertObjectKeysToHumanReadable(existingValue: unknown): unknown {
  if (Array.isArray(existingValue)) {
    return existingValue.map((item) => convertObjectKeysToHumanReadable(item));
  }
  if (existingValue && typeof existingValue === 'object' && existingValue !== null) {
    const newObject: { [key: string]: unknown } = {};
    for (const key of Object.keys(existingValue)) {
      const humanReadableKey = toHumanReadableKey(key);
      newObject[humanReadableKey] = convertObjectKeysToHumanReadable((existingValue as typeof newObject)[key]);
    }
    return newObject;
  }
  return existingValue;
}
