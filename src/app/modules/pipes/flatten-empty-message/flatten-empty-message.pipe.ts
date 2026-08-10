import { Pipe, PipeTransform } from '@angular/core';

/**
 * Flattens an `EmptyConfig.message` to plain text for `tn-empty`'s text inputs.
 *
 * Those messages were written for `<ix-empty>`, which rendered them as HTML, so
 * several carry `<br>`/`<p>` markup. `tn-empty`'s `[title]`/`[description]` are
 * text inputs, so a migrated empty state has to strip the markup — at runtime,
 * off the translated string, rather than by re-wording the catalog key, which
 * would mint a new key and drop every existing translation.
 *
 * Chain it after `translate` so the catalog key stays the source of truth and the result
 * follows a language change:
 *
 * ```html
 * [title]="emptyConfig.message | translate | flattenEmptyMessage"
 * ```
 *
 * ⚠ Strips anything matching `<…>`, so a message containing a literal `<` followed by a `>`
 * later in the string ("completes in <5 minutes") would lose the text between them. No catalog
 * message does today, but the input is translator-supplied — prefer `&lt;` in a message that
 * needs a literal one.
 *
 * Exported as a plain function as well as a pipe because the same flattening is needed off a
 * template — `dataProviderEmptyState` resolves its description in TypeScript.
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
