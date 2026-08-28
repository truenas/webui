import { FormControl, ValidatorFn } from '@angular/forms';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

export function datasetNameTooLong(parentPath: string): ValidatorFn {
  // Two characters shorter than what is left of the budget: one goes to the `/` separator, and
  // `maxDatasetPath` is the first length that is already too long (it is compared with `>=`,
  // same as in DatasetFormService.checkAndWarnForLengthAndDepth).
  const maxNameLength = maxDatasetPath - parentPath.length - 2;

  return function datasetNameTooLongValidate(control: FormControl<string>) {
    if (!control.value || !parentPath) {
      return null;
    }

    // "no more than 0 characters" is a limit no name can meet - the parent path itself is the
    // problem, so say that instead.
    if (maxNameLength <= 0) {
      return {
        [DefaultValidationError.ParentPathTooLong]: { maxPathLength: maxDatasetPath },
      };
    }

    if (control.value.length > maxNameLength) {
      return {
        [DefaultValidationError.MaxLength]: { requiredLength: maxNameLength },
      };
    }

    return null;
  };
}
