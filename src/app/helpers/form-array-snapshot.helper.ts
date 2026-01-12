import { DestroyRef, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray } from '@ngneat/reactive-forms';

/**
 * Creates a signal that tracks form array changes to prevent
 * infinite change detection loops when using signals with reactive forms.
 *
 * This helper solves a common problem when mixing signals and reactive forms:
 * - Reading form array values directly in a computed signal causes circular reactivity
 * - Changes trigger re-computation, which can cause infinite loops
 * - The snapshot pattern breaks the cycle by updating only on valueChanges emissions
 *
 * @param formArray The FormArray to track
 * @param destroyRef DestroyRef for automatic cleanup
 * @param initialValue Optional initial value (defaults to formArray.getRawValue())
 * @returns A signal that updates whenever the form array changes
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   private destroyRef = inject(DestroyRef);
 *
 *   form = this.fb.group({
 *     items: this.fb.array([])
 *   });
 *
 *   // Create snapshot that tracks form changes
 *   itemsSnapshot = createFormArraySnapshot(
 *     this.form.controls.items,
 *     this.destroyRef
 *   );
 *
 *   // Use in computed signals safely
 *   processedItems = computed(() => {
 *     return this.itemsSnapshot().map(item => transform(item));
 *   });
 * }
 * ```
 */
export function createFormArraySnapshot<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formArray: FormArray<any>,
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
