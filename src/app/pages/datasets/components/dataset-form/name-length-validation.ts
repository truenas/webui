import { FormControl, ValidatorFn } from '@angular/forms';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

export function datasetNameTooLong(parentPath: string): ValidatorFn {
  const maxLengthAllowed = 200;
  let thisControl: FormControl<string>;

  return function datasetNameTooLongValidate(control: FormControl<string>) {
    if (!control.parent || !control.value || !parentPath) {
      return null;
    }

    if (!thisControl) {
      thisControl = control;
    }

    if (parentPath.length + thisControl.value.length >= maxLengthAllowed) {
      return {
        [DefaultValidationError.MaxLength]: { requiredLength: maxLengthAllowed - parentPath.length },
      };
    }

    return null;
  };
}
