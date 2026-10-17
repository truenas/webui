import { AbstractControl, FormControl, FormControlStatus } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  filter, first, map, startWith,
} from 'rxjs/operators';

/**
 * Whether every given control passes validation once its pending checks answer, judged on detached copies.
 *
 * For an entry form about to be patched with another entry's values: the patch re-runs validation on the live
 * controls, which cancels a check still in flight, so the verdict on the entry being left is never reached.
 * Each copy holds the control's current value and validators, and nothing the form does afterwards cancels it.
 */
export function validityAfterPendingChecks(controls: AbstractControl[]): Observable<boolean> {
  const verdicts = controls.map((control) => {
    const copy = new FormControl(control.value, control.validator, control.asyncValidator);
    return copy.statusChanges.pipe(
      startWith(copy.status),
      filter((status: FormControlStatus) => status !== 'PENDING'),
      first(),
      map((status) => status === 'VALID'),
    );
  });

  return forkJoin(verdicts).pipe(map((results) => results.every(Boolean)));
}
