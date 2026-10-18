import { AbstractControl, FormControl, FormControlStatus } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  filter, first, map, startWith,
} from 'rxjs/operators';

/**
 * Whether every given control passes validation once its pending checks answer, judged on detached copies.
 *
 * For an entry form that may move on before its check answers: patching another entry in re-runs validation on the
 * live controls, and tearing the form down detaches the directory field's validator, and either cancels a check
 * still in flight. Each copy holds the control's value and validators as they are now, and nothing the form does
 * afterwards cancels it. Take the copies while the validators are still attached.
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
