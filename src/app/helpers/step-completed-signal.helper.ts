import { afterNextRender, isSignal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
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
  // When a ControlValueAccessor attaches (formControlName binding during the first
  // render), Angular re-runs the control's validators with `emitEvent: false`. An async
  // validator resolving from that run flips PENDING → VALID/INVALID without a
  // `statusChanges` emission, so an emission-fed signal goes stale and step gating
  // swallows Next clicks (NAS-141058). Once the first render is done (CVAs attached),
  // restart validation with `emitEvent: true` so the eventual resolution is observed.
  afterNextRender(() => {
    const control = isSignal(form) ? form() : form;
    if (control) {
      revalidateControls(control);
    }
  });

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

function revalidateControls(control: AbstractControl): void {
  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach((child) => revalidateControls(child as AbstractControl));
  }
  // Only async validators can resolve silently — sync validators settle at construction,
  // before the signal first reads. Restricting the restart avoids valueChanges side
  // effects (e.g. enable/disable relations) on unaffected controls. onlySelf keeps the
  // walk from re-triggering ancestor validation per child; each control's resolution
  // still propagates status upward.
  if (control.asyncValidator) {
    control.updateValueAndValidity({ onlySelf: true });
  }
}
