import { Injectable } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

@Injectable({
  providedIn: 'root',
})
export class FileValidatorService {
  constructor(
    private translate: TranslateService,
  ) {}

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
