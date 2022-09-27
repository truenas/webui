import { UntypedFormControl, ValidatorFn } from '@angular/forms';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

export function datasetNameTooLong(parentPath: string): ValidatorFn {
  const maxLengthAllowed = 200;
  let thisControl: UntypedFormControl;

  return function datasetNameTooLongValidate(control: UntypedFormControl) {
    if (!control.parent) {
      return null;
    }

    // Initializing the validator.
    if (!thisControl) {
      thisControl = control;
    }

    if (thisControl.value === '' || thisControl.value === undefined) {
      return null;
    }

    if (!parentPath) {
      return null;
    }

    if (parentPath.length + thisControl.value.length >= maxLengthAllowed) {
      return {
        [DefaultValidationError.MaxLength]: { requiredLength: maxLengthAllowed - parentPath.length },
      };
    }

    return null;
  };
}
