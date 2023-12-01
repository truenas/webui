/**
 * When requesting multiple translations at the same time from TranslationService,
 * it will return an object where key is an original message, and value is a translation.
 */
export type TranslatedMessages = Record<string, string>;
