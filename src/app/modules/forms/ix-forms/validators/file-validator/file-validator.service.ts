import { Injectable, inject } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FileSystemItem } from '@truenas/ui-components';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { ixManualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';

@Injectable({
  providedIn: 'root',
})
export class FileValidatorService {
  private translate = inject(TranslateService);

  /**
   * validator that, given a function to retrieve the item last picked in a `tn-file-picker` (like a
   * signal fed from its `itemSelectionChange`, with `path` in the form's value space), ensures a
   * *file* is selected. this is used specifically when something like a directory *must not* be
   * selected. */
  fileIsSelected(getSelectedItem: () => FileSystemItem | null) {
    return (control: FormControl<string>): ValidationErrors | null => {
      const selectedItem = getSelectedItem();
      const path = control.value;
      const lastSelectedPath = selectedItem?.path;
      const err = {
        selectionMustBeFile: true,
      };

      // an empty path is *technically* invalid, but we assume validity since most of the time `Validators.required`
      // will catch an empty path and not permit submitting the form.
      if (path === '') {
        return null;
      }

      // case: existing file or directory selected.
      if (path === lastSelectedPath) {
        // if the selected node is a file, no problems
        if (selectedItem?.type === 'file') {
          return null;
        }

        // otherwise, it's a directory, which is not allowed.
        return err;
      }

      // case: the user has manually entered a path.
      //
      // we're unable to validate if what they've typed is a valid path without
      // making API calls, which are out of scope for this validator. so we just
      // assume it's a valid path and let it pass since it'll eventually be caught
      // by the backend.
      return null;
    };
  }

  /**
   * Accepts either shape a file control can hold: the legacy file input always stored a `File[]`,
   * `tn-file-input` in single mode stores one `File`.
   */
  maxSize(maxSizeInBytes: number) {
    return (control: FormControl<File | File[] | null>): ValidationErrors | null => {
      const value = control.value;
      const files = value ? [value].flat() : [];
      if (!files.length) {
        return null;
      }

      for (const file of files) {
        if (file.size > maxSizeInBytes) {
          return {
            [ixManualValidateErrorKey]: {
              message: this.translate.instant(
                'Maximum file size is limited to {maxSize}.',
                { maxSize: buildNormalizedFileSize(maxSizeInBytes) },
              ),
            },
          };
        }
      }
      return null;
    };
  }
}
