export function toHumanReadableKey(str: string): string {
  // Capitalize first letter of each word
  const capitalizeFirstLetter = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  // Handle special abbreviations
  const handleAbbreviations = (word: string): string => {
    const abbreviations = ['ID', 'IP', 'API'];
    const lowerCaseWord = word.toLowerCase();

    for (const abbr of abbreviations) {
      if (lowerCaseWord.startsWith(abbr.toLowerCase())) {
        return abbr + lowerCaseWord.slice(abbr.length);
      }
    }

    return capitalizeFirstLetter(word);
  };

  return str
    // Replace underscores or dashes with spaces
    .replace(/[_-]+/g, ' ')
    // Insert a space before any uppercase letters in the middle of words
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Trim whitespace at the start and end
    .trim()
    // Split into words and process each word
    .split(/\s+/)
    .map(handleAbbreviations)
    // Join the words back into a string
    .join(' ');
}

export function convertObjectKeysToHumanReadable(existingValue: unknown): unknown {
  if (Array.isArray(existingValue)) {
    return existingValue.map((item) => convertObjectKeysToHumanReadable(item));
  }

  if (existingValue && typeof existingValue === 'object' && existingValue !== null) {
    const newObject: Record<string, unknown> = {};
    for (const key of Object.keys(existingValue)) {
      const humanReadableKey = toHumanReadableKey(key);
      newObject[humanReadableKey] = convertObjectKeysToHumanReadable((existingValue as typeof newObject)[key]);
    }
    return newObject;
  }
  return existingValue;
}
