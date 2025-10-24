import { Injectable, inject } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';

@Injectable({
  providedIn: 'root',
})
export class FileValidatorService {
  private translate = inject(TranslateService);

  /*
   * validator that, given a function to retrieve the explorer component (like a signal),
   * ensures the given explorer has a *file* selected. this is used specifically when
   * something like a directory *must not* be selected. */
  fileIsSelectedInExplorer(getExplorer: () => IxExplorerComponent | undefined) {
    return (control: FormControl<string>): ValidationErrors | null => {
      const explorer = getExplorer();

      // if the retrieved explorer is `null` or `undefined`, then just assume validity.
      // this prevents the form from being invalidated prior to initialization, like when the explorer
      // may not have been created yet.
      if (!explorer) {
        return null;
      }

      const path = control.value;
      const lastSelectedPath = explorer.lastSelectedNode()?.data?.path;
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
        if (explorer.lastSelectedNode()?.data.type === ExplorerNodeType.File) {
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

  maxSize(maxSizeInBytes: number) {
    return (control: FormControl<File[] | null>): ValidationErrors | null => {
      const files = control.value;
      if (!files?.length) {
        return null;
      }

      for (const file of files) {
        if (file.size > maxSizeInBytes) {
          return {
            [ixManualValidateError]: {
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
