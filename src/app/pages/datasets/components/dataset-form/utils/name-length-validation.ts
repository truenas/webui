import { FormControl, ValidatorFn } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { maxDatasetPath } from 'app/constants/dataset.constants';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

export function datasetNameTooLong(parentPath: string, translate: TranslateService): ValidatorFn {
  return function datasetNameTooLongValidate(control: FormControl<string>) {
    if (!control.value || !parentPath) {
      return null;
    }

    // What the name may still spend of the `<parent>/<name>` budget: the parent path and
    // the separator are already gone, and the whole thing has to stay under maxDatasetPath
    // (the same `>=` boundary the two other path-length checks use).
    //
    // This number is quoted back to the user in the maxlength message, so it has to be the
    // limit that is actually enforced. Reporting `maxDatasetPath - parentPath.length`
    // promised two characters more than the check allowed: with a 198-character parent the
    // field said "no more than 2" and then rejected a one-character name.
    const maxNameLength = Math.max(0, maxDatasetPath - parentPath.length - 2);

    if (control.value.length <= maxNameLength) {
      return null;
    }

    if (maxNameLength === 0) {
      // "no more than 0" is not a length anyone can aim for: the parent path has spent the
      // whole budget, and nothing will fit under it. Say that instead — a custom `message`
      // takes precedence over the generic maxlength wording in both error renderers.
      return {
        [DefaultValidationError.MaxLength]: {
          requiredLength: 0,
          message: translate.instant(
            T('The parent path already fills the {max} character limit for a dataset path, so nothing can be created under it.'),
            { max: maxDatasetPath },
          ),
        },
      };
    }

    return {
      [DefaultValidationError.MaxLength]: { requiredLength: maxNameLength },
    };
  };
}
