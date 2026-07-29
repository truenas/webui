/**
 * Flattens an `EmptyConfig.message` to plain text.
 *
 * Those messages were written for `<ix-empty>`, which rendered them as HTML, so
 * several carry `<br>`/`<p>` markup. `tn-empty`'s `[title]`/`[description]` are
 * text inputs, so a migrated empty state has to strip the markup — at runtime,
 * off the translated string, rather than by re-wording the catalog key, which
 * would mint a new key and drop every existing translation.
 */
export function flattenEmptyConfigMessage(message: string): string {
  return message
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
