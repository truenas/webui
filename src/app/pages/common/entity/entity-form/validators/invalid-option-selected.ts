import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Option } from 'app/interfaces/option.interface';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

export function selectedOptionValidator(validOptions: Promise<Option[]>): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors> => {
    return validOptions.then((options) => {
      const selectedInvalidOptions = control.value.filter((v: unknown) => {
        if (_.find(options, { value: v }) === undefined) {
          return v;
        }
      });
      return selectedInvalidOptions.length > 0 ? { invalidOptionSelected: true, invalidOptins: selectedInvalidOptions } : null;
    })
  };
}
