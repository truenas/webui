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

    // The name's share of the `<parent>/<name>` budget after the parent and separator, under the same
    // `>=` boundary as the other path checks. It's quoted in the maxlength message, so it must match
    // what's enforced (`maxDatasetPath - parentPath.length` overstated it by two).
    const maxNameLength = Math.max(0, maxDatasetPath - parentPath.length - 2);

    if (control.value.length <= maxNameLength) {
      return null;
    }

    if (maxNameLength === 0) {
      // With no budget left, say so instead of "no more than 0"; a custom `message` overrides the
      // generic wording. The quoted limit is `maxDatasetPath - 1`, the longest path that passes `>=`.
      return {
        [DefaultValidationError.MaxLength]: {
          requiredLength: 0,
          message: translate.instant(
            T('The parent path is too long to fit a dataset name under it: a dataset path can be at most {max} characters.'),
            { max: maxDatasetPath - 1 },
          ),
        },
      };
    }

    return {
      [DefaultValidationError.MaxLength]: { requiredLength: maxNameLength },
    };
  };
}
