import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

export function selectedOptionValidator(validOptions): AsyncValidatorFn {
  return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
    return validOptions.then((options) => {
      const selectedInvalidOptions = control.value.filter(v => {
        if (_.find(options, { value: v }) === undefined) {
          return v;
        }
      });
      return selectedInvalidOptions.length > 0 ? { invalidOptionSelected: true, invalidOptins: selectedInvalidOptions } : null;
    })
  };
}