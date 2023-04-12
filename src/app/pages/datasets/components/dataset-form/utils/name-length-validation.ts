import { FormControl, ValidatorFn } from '@angular/forms';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

export function datasetNameTooLong(parentPath: string): ValidatorFn {
  const maxLengthAllowed = maxDatasetPath;

  return function datasetNameTooLongValidate(control: FormControl<string>) {
    if (!control.value || !parentPath) {
      return null;
    }

    if (parentPath.length + 1 + control.value.length >= maxLengthAllowed) {
      return {
        [DefaultValidationError.MaxLength]: { requiredLength: maxLengthAllowed - parentPath.length },
      };
    }

    return null;
  };
}
