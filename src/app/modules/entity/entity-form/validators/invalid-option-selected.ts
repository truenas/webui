import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import * as _ from 'lodash';
import { Option } from 'app/interfaces/option.interface';

export function selectedOptionValidator(validOptions: Promise<Option[]>): AsyncValidatorFn {
  return (control: AbstractControl): Promise<ValidationErrors> => validOptions.then((options) => {
    const selectedInvalidOptions = control.value.filter((value: unknown) => {
      if (_.find(options, { value }) === undefined) {
        return value;
      }

      return undefined;
    });
    return selectedInvalidOptions.length > 0
      ? { invalidOptionSelected: true, invalidOptins: selectedInvalidOptions }
      : null;
  });
}
