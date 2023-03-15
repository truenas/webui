import {
  AsyncValidatorFn, FormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { map, Observable, take } from 'rxjs';

export function forbiddenValues(arrayOfValues: unknown[], caseInsensitive?: boolean): ValidatorFn {
  return (control: FormControl): ValidationErrors | null => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
  };
}

export function forbiddenAsyncValues(
  arrayOfValues$: Observable<unknown[]>,
  caseInsensitive?: boolean,
): AsyncValidatorFn {
  return (control: FormControl): Observable<ValidationErrors> | null => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    return arrayOfValues$.pipe(
      map((arrayOfValues) => {
        return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
      }),
      // prevents FormControl.status:"PENDING"
      // https://github.com/angular/angular/issues/41519
      take(1),
    );
  };
}

function forbiddenValuesError(
  values: unknown[],
  caseInsensitive: boolean,
  formControlo: FormControl<string>,
): ValidationErrors | null {
  if (caseInsensitive) {
    if (values.includes(formControlo.value.toLowerCase())) {
      return { forbidden: true, value: formControlo.value };
    }
  } else if (values.includes(formControlo.value)) {
    return { forbidden: true, value: formControlo.value };
  }
  return null;
}
