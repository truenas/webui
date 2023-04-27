import {
  AsyncValidatorFn, FormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import {
  map, Observable, of, shareReplay,
} from 'rxjs';
import { catchError } from 'rxjs/operators';

export function forbiddenValues(arrayOfValues: string[], caseInsensitive?: boolean): ValidatorFn {
  return (control: FormControl): ValidationErrors | null => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
  };
}

export function forbiddenAsyncValues(
  arrayOfValues$: Observable<string[]>,
  caseInsensitive?: boolean,
): AsyncValidatorFn {
  const request$ = arrayOfValues$.pipe(
    shareReplay({ refCount: false, bufferSize: 1 }),
    catchError((error) => {
      console.error(error);
      return of(null);
    }),
  );

  return (control: FormControl): Observable<ValidationErrors> | null => {
    if (control.value === '' || control.value === undefined) {
      return of(null);
    }

    return request$.pipe(
      map((arrayOfValues) => {
        return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
      }),
    );
  };
}

export function forbiddenValuesError(
  values: string[],
  caseInsensitive: boolean,
  formControlo: FormControl<string>,
): ValidationErrors | null {
  if (caseInsensitive) {
    const existingValue = values.find((val) => val.toLowerCase().trim() === formControlo.value.toLowerCase().trim());
    return existingValue ? { forbidden: true, value: existingValue } : null;
  }
  if (values.includes(formControlo.value)) {
    return { forbidden: true, value: formControlo.value };
  }

  return null;
}
