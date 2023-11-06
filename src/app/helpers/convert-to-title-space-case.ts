export function convertToTitleSpaceCase(value: string): string {
  let words = value.split('_');
  words = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return words.join(' ');
}
