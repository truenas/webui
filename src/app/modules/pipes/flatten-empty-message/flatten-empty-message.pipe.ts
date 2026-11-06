import { Pipe, PipeTransform } from '@angular/core';

/**
 * Strips the `<br>`/`<p>` markup that `EmptyConfig.message` strings carry from `<ix-empty>` days,
 * since `tn-empty` takes text. It runs on the translated string because rewording the key would drop
 * its translations, so chain it after `translate`. Anything matching `<…>` goes, so a literal `<`
 * needs `&lt;`. Also exported as a function for TypeScript callers like `dataProviderEmptyState`.
 */
export function flattenEmptyMessage(message: string | undefined): string {
  // `EmptyConfig.message` is optional, so this has to tolerate an absent one
  // rather than throw on the first config that omits it.
  return (message ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Template-side wrapper around {@link flattenEmptyMessage}. */
@Pipe({
  name: 'flattenEmptyMessage',
})
export class FlattenEmptyMessagePipe implements PipeTransform {
  transform(message: string | undefined): string {
    return flattenEmptyMessage(message);
  }
}
