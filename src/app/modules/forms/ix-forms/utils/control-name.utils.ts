import { inject } from '@angular/core';
import type { NgControl } from '@angular/forms';
import { FormField } from '@angular/forms/signals';

/**
 * The name a composite control is bound under, for its `data-test` ids: `formControlName`'s, or the last
 * non-index segment of a signal form `[formField]` path, whose interop `NgControl` has no `name`. Call it in the
 * control's injection context with the `NgControl` it already injected; the result is cheap to read in a template.
 */
export function injectControlName(ngControl: NgControl | null): () => string | null {
  const formField = inject(FormField, { self: true, optional: true });
  return () => {
    const name = ngControl?.name;
    if (name != null && name !== '') {
      return String(name);
    }
    // The last segment that is not a row index, so a control bound to `form.ports[0]` is still `ports`.
    return formField?.state().name().split('.').findLast((part) => part !== '' && !/^\d+$/.test(part)) ?? null;
  };
}
