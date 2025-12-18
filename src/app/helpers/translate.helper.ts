/**
 * Marker function for translatable strings in TypeScript code.
 * This doesn't actually translate - it just marks strings for extraction by i18n tools.
 * The actual translation happens in templates via the translate pipe or TranslateService.
 */
export function marker(key: string): string {
  return key;
}
