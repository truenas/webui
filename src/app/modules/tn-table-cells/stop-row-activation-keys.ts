/** The keys `tn-table`'s row handler treats as "activate this row". */
const rowActivationKeys = new Set(['Enter', ' ']);

/**
 * Keeps a row-activation keypress inside an interactive cell.
 *
 * `tn-table`'s row handler calls `preventDefault()` on Enter/Space without checking the
 * event target, so without this a button or toggle inside a row loses its own activation
 * and toggles the row instead. Scoped to those two keys on purpose: swallowing every
 * keydown would also take Escape and any table-level keyboard navigation out with it.
 */
export function stopRowActivationKeys(event: KeyboardEvent): void {
  if (rowActivationKeys.has(event.key)) {
    event.stopPropagation();
  }
}
