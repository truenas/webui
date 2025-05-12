import { TranslateService } from '@ngx-translate/core';
import { Brand } from 'utility-types';

export function translateOptions<
  Value,
  OptionLike extends { label: string; value: Value },
>(
  translate: TranslateService,
  options: OptionLike[],
): (Omit<OptionLike, 'label'> & { label: TranslatedString })[] {
  return options.map((option) => {
    return {
      ...option,
      label: translate.instant(option.label),
    };
  });
}

/**
 * If you get an error:
 * 1. If your string needs to be translated, make sure that `translate.instant()` or translate pipe is used.
 * 2. If your string does not need or cannot be translated, wrap it in `ignoreTranslation()`.
 */
export type TranslatedString = Brand<string, 'This string must be translated'> | '';

export function ignoreTranslation(str: string): TranslatedString {
  return str as TranslatedString;
}
