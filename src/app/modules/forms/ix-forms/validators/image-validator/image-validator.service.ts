import { Injectable } from '@angular/core';
import { AsyncValidatorFn, FormControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  concatMap,
  from,
  map, Observable, Observer, of, take, toArray,
} from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { ValidatedFile } from 'app/interfaces/validated-file.interface';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

@Injectable({
  providedIn: 'root',
})
export class ImageValidatorService {
  constructor(
    private translate: TranslateService,
  ) { }

  getImagesValidator(fileSizeLimitBytes: number): AsyncValidatorFn {
    return (control: FormControl<File[]>): Observable<ValidationErrors> | null => {
      return this.validateImages(control.value, fileSizeLimitBytes).pipe(
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

  private validateImages(screenshots: File[], sizeLimitBytes: number): Observable<ValidatedFile[]> {
    return from(screenshots).pipe(
      take(screenshots.length),
      concatMap((file: File): Observable<ValidatedFile> => {
        return this.validateImage(file, sizeLimitBytes).pipe(
          catchError((error: unknown) => of(error as ValidatedFile)),
        );
      }),
      toArray(),
    );
  }

  private validateImage(file: File, sizeLimitBytes: number): Observable<ValidatedFile> {
    const fileReader = new FileReader();
    const { type, name, size } = file;
    return new Observable((observer: Observer<ValidatedFile>) => {
      if (
        sizeLimitBytes != null
        && !Number.isNaN(sizeLimitBytes)
        && size > sizeLimitBytes
      ) {
        observer.error({
          error: {
            name,
            errorMessage: this.translate.instant('File size is limited to {n} MiB.', { n: sizeLimitBytes / MiB }),
          },
        });
      }

      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        if (type.startsWith('image/')) {
          const image = new Image();
          image.onload = () => {
            observer.next({ file });
            observer.complete();
          };
          image.onerror = () => {
            observer.error({ error: { name, errorMessage: this.translate.instant('Invalid image') } });
          };
          image.src = fileReader.result as string;
        } else {
          observer.next({ file });
          observer.complete();
        }
      };
      fileReader.onerror = () => {
        observer.error({ error: { name, errorMessage: this.translate.instant('Invalid file') } });
      };
    });
  }
}
