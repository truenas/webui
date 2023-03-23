import {
  AsyncValidatorFn, FormControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import {
  EMPTY, map, Observable, of, take,
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
  let storeValues$: Observable<string[]> = null;

  arrayOfValues$.pipe(
    catchError((error) => {
      console.error(error);
      return EMPTY;
    }),
    take(1),
  ).subscribe((values) => storeValues$ = of(values));

  return (control: FormControl): Observable<ValidationErrors> | null => {
    if (control.value === '' || control.value === undefined) {
      return null;
    }

    if (storeValues$ !== null) {
      return storeValues$.pipe(
        map((arrayOfValues) => {
          return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
        }),
        // prevents FormControl.status:"PENDING"
        // https://github.com/angular/angular/issues/41519
        take(1),
      );
    }

    return arrayOfValues$.pipe(
      map((arrayOfValues) => {
        return forbiddenValuesError(arrayOfValues, caseInsensitive, control);
      }),
      catchError((error) => {
        console.error(error);
        return EMPTY;
      }),
      take(1),
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
