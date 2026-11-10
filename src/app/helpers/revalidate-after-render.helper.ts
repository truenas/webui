import { afterNextRender, Injector } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Re-runs validation on `controls` once the view has rendered.
 *
 * When an `@if` hides a `formControlName` that carries a template validator (`[required]="true"`),
 * Angular drops that validator with `setValidators()` but never re-validates, so the hidden control
 * keeps its stale `required` error and the form stays invalid. Call this from whatever change shows
 * or hides such fields, so their status is recomputed after the view has caught up.
 */
export function revalidateAfterRender(injector: Injector, controls: AbstractControl[]): void {
  afterNextRender({
    write: () => controls.forEach((control) => control.updateValueAndValidity()),
  }, { injector });
}
