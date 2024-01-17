import { Injectable } from '@angular/core';
import { AsyncValidatorFn, FormControl, ValidationErrors } from '@angular/forms';
import {
  map, Observable, of, switchMap,
} from 'rxjs';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';

@Injectable({
  providedIn: 'root',
})
export class ImageValidatorService {
  constructor(
    private fileUpload: IxFileUploadService,
  ) {}

  // TODO: Move validateImages from fileUpload service here?
  // TODO: Check if this works.
  validateImages(): AsyncValidatorFn {
    return (control: FormControl<File[]>): Observable<ValidationErrors> | null => {
      return of(control.value).pipe(
        switchMap((images) => this.fileUpload.validateImages(images)),
        map((validatedFiles) => {
          const invalidFiles = validatedFiles
            .filter((file) => file.error)
            .map((file) => file.error);

          if (!invalidFiles.length) {
            return null;
          }

          const message = invalidFiles.map((error) => `${error.name} – ${error.errorMessage}`).join('\n');
          return { [ixManualValidateError]: { message } };
        }),
      );
    };
  }
}
