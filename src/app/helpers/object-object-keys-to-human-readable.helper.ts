export function toHumanReadableKey(key: string): string {
  // Split the string at underscores or camelCase
  return key
    // Insert a space before all caps and split by underscores
    .replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
    // split by hyphen
    .replace(/-/g, ' ')
    // Trim spaces at the start of the string
    .replace(/^ /, '')
    // Capitalize the first letter of each word
    .replace(/\b./g, match => match.toUpperCase());
}

export function convertObjectKeysToHumanReadable(existingValue: unknown): unknown {
  if (Array.isArray(existingValue)) {
    return existingValue.map(item => convertObjectKeysToHumanReadable(item));
  } else if (existingValue && typeof existingValue === 'object' && existingValue !== null) {
    const newObject: { [key: string]: unknown } = {};
    for (const key of Object.keys(existingValue)) {
      const humanReadableKey = toHumanReadableKey(key);
      newObject[humanReadableKey] = convertObjectKeysToHumanReadable((existingValue as typeof newObject)[key]);
    }
    return newObject;
  }
  return existingValue;
}
