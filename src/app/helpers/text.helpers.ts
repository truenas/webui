export function capitalizeFirstLetter(text: string): string {
  text = text.toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
