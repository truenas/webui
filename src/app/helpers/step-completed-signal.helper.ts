import { isSignal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { switchMap } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Tracks a form's validity as a signal for driving tn-stepper's `[completed]` input
 * (the declarative replacement for mat-stepper's `[stepControl]`). Seeded with the
 * current validity and updated on every status change, so gating never reads
 * `form.valid` during change detection (OnPush-safe).
 *
 * Accepts either a form directly, or a signal of a form for inputs whose form
 * identity is set after construction (e.g. `input.required()`); in the latter case
 * the validity is seeded to `false` since the form is not yet available.
 *
 * Must be called in an injection context (e.g. a field initializer).
 */
export function stepCompletedSignal(form: AbstractControl | Signal<AbstractControl>): Signal<boolean> {
  if (isSignal(form)) {
    return toSignal(
      toObservable(form).pipe(
        switchMap((control) => control.statusChanges.pipe(startWith(control.status), map(() => control.valid))),
      ),
      { initialValue: false },
    );
  }

  return toSignal(
    form.statusChanges.pipe(startWith(form.status), map(() => form.valid)),
    { initialValue: form.valid },
  );
}
