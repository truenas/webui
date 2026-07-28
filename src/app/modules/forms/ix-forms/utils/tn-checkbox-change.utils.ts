/**
 * Narrows a `tn-checkbox` `(change)` payload to the component's own boolean emission.
 *
 * TEMP (NAS-141021): library defect in the pinned `@truenas/ui-components` (0.3.26) — indexed in
 * the tn-migration playbook's "Known upstream defects" table. `tn-checkbox` emits a boolean from
 * its `change` output, but the inner `<input>`'s native `change` event also bubbles to the host,
 * and Ivy invokes a `(change)` binding for both the output and the DOM event — so the handler
 * fires a second time with an `Event`. Fixed upstream in 0.4.x, which calls `stopPropagation()`
 * in `onCheckboxChange` (`tn-radio` already did).
 *
 * Drop this helper — and the guards that call it — once the dependency range moves past 0.4.0;
 * keeping the explanation here rather than per call site makes that a single-file change.
 *
 * @example
 * ```ts
 * protected onToggle(event: boolean | Event): void {
 *   if (!isTnCheckboxChange(event)) {
 *     return;
 *   }
 *   // `event` is the checked state
 * }
 * ```
 */
export function isTnCheckboxChange(event: boolean | Event): event is boolean {
  return typeof event === 'boolean';
}
