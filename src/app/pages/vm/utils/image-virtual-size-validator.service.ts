import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormGroup, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

/**
 * Service that creates async validators for checking if disk size is sufficient for imported VM images.
 * Provides separate validators for new disk creation (volsize) and existing disk selection (hdd_path).
 *
 * Note: This service is stateless. The component manages caching of virtual size API calls.
 */
@Injectable({ providedIn: 'root' })
export class ImageVirtualSizeValidatorService {
  private validators = inject(IxValidatorsService);
  private translate = inject(TranslateService);

  /**
   * Creates an async validator for the volsize control (new disk creation).
   * Checks if the specified disk size is sufficient for the imported image.
   *
   * @param form The form group containing the import_image and image_source controls
   * @param getVirtualSize Function to get the virtual size (provided by component with caching)
   */
  validateVolsize(
    form: FormGroup,
    getVirtualSize: (imagePath: string) => Observable<number | null>,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const importImage = form.controls.import_image?.value as boolean | undefined;
      const imageSource = form.controls.image_source?.value as string | undefined;

      // Only validate if importing an image
      if (!importImage || !imageSource || !control.value) {
        return of(null);
      }

      return getVirtualSize(imageSource).pipe(
        map((virtualSize: number | null): ValidationErrors | null => {
          if (virtualSize === null) {
            return null;
          }

          const volsize = control.value as number;

          if (volsize >= virtualSize) {
            return null;
          }

          return this.validators.makeErrorMessage(
            'insufficientSize',
            this.translate.instant(
              'Disk size must be at least {required} to accommodate the imported image',
              { required: buildNormalizedFileSize(virtualSize) },
            ),
          );
        }),
      );
    };
  }

  /**
   * Creates an async validator for the hdd_path control (existing disk selection).
   * Checks if the selected zvol is large enough for the imported image.
   *
   * @param form The form group containing the import_image and image_source controls
   * @param getVirtualSize Function to get the virtual size (provided by component with caching)
   * @param queryDataset Function to query dataset information (provided by component)
   */
  validateHddPath(
    form: FormGroup,
    getVirtualSize: (imagePath: string) => Observable<number | null>,
    queryDataset: (datasetPath: string) => Observable<Dataset[]>,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const importImage = form.controls.import_image?.value as boolean | undefined;
      const imageSource = form.controls.image_source?.value as string | undefined;
      const hddPath = control.value as string | undefined;

      // Only validate if importing an image and a path is selected
      if (!importImage || !imageSource || !hddPath) {
        return of(null);
      }

      return getVirtualSize(imageSource).pipe(
        switchMap((virtualSize: number | null) => {
          if (virtualSize === null) {
            return of(null);
          }

          // Extract the dataset path from the zvol path (e.g., /dev/zvol/tank/vm-disk -> tank/vm-disk)
          if (!hddPath.startsWith('/dev/zvol/')) {
            console.error('Invalid zvol path format, expected path to start with /dev/zvol/:', hddPath);
            return of(null);
          }

          const datasetPath = hddPath.replace(/^\/dev\/zvol\//, '');
          if (!datasetPath || datasetPath.includes('//')) {
            console.error('Invalid zvol path format, dataset path is empty or contains double slashes:', hddPath);
            return of(null);
          }

          return queryDataset(datasetPath).pipe(
            map((datasets: Dataset[]): ValidationErrors | null => {
              if (datasets.length === 0) {
                console.error('Dataset not found for path:', datasetPath);
                return null;
              }

              const dataset = datasets[0];
              if (dataset.type !== DatasetType.Volume || !dataset.volsize?.parsed) {
                console.error('Selected dataset is not a zvol or has no volsize:', dataset);
                return null;
              }

              const zvolSize = dataset.volsize.parsed;
              if (zvolSize >= virtualSize) {
                return null;
              }

              return this.validators.makeErrorMessage(
                'insufficientZvolSize',
                this.translate.instant(
                  'Selected zvol ({current}) is too small for the imported image (requires {required})',
                  {
                    current: buildNormalizedFileSize(zvolSize),
                    required: buildNormalizedFileSize(virtualSize),
                  },
                ),
              );
            }),
          );
        }),
      );
    };
  }
}
