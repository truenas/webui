export function capitalizeFirstLetter(text: string): string {
  const transformedText = text.toLowerCase();
  return transformedText.charAt(0).toUpperCase() + transformedText.slice(1);
}
