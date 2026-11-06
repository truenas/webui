import { DestroyRef, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray } from '@angular/forms';

/**
 * A signal of a FormArray's value, updated only on `valueChanges`. Reading the form array directly in
 * a `computed` causes circular reactivity and change-detection loops; read this instead. Seeded with
 * `initialValue`, or `getRawValue()` by default, and cleaned up with `destroyRef`.
 */
export function createFormArraySnapshot<T>(
  formArray: FormArray,
  destroyRef: DestroyRef,
  initialValue?: T[],
): WritableSignal<T[]> {
  const snapshot = signal<T[]>(initialValue ?? formArray.getRawValue() as T[]);

  formArray.valueChanges.pipe(
    takeUntilDestroyed(destroyRef),
  ).subscribe(() => {
    snapshot.set(formArray.getRawValue() as T[]);
  });

  return snapshot;
}
