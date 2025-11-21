import { Injectable, Signal, inject } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of, Observable } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable()
export class WebShareValidatorService {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  validateWebShareName(sharesSignal: Signal<WebShare[]>, excludeId: number | null = null): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const shares = sharesSignal();
      // Filter out the share being edited
      const otherShares = excludeId ? shares.filter((share) => share.id !== excludeId) : shares;

      const nameExists = otherShares.some(
        (share) => share.name === control.value,
      );
      if (nameExists) {
        return of({
          nameExists: {
            message: this.translate.instant(helptextSharingWebshare.validation_errors.name_exists),
          },
        });
      }

      return of(null);
    };
  }

  validateWebSharePath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const path = control.value as string;

      // Check if path is under /mnt/
      if (!path.startsWith('/mnt/')) {
        return {
          pathInvalid: {
            message: this.translate.instant(helptextSharingWebshare.validation_errors.path_invalid),
          },
        };
      }

      // Check if it's a root dataset
      const pathParts = path.substring(5).split('/'); // Remove '/mnt/' prefix
      if (pathParts.length === 1) {
        return {
          rootDataset: {
            message: this.translate.instant(helptextSharingWebshare.validation_errors.path_root_dataset),
          },
        };
      }

      return null;
    };
  }

  /**
   * Validates that a WebShare path doesn't create nesting conflicts with existing shares.
   * Prevents both a new share from being inside an existing share and an existing share
   * from being inside the new share.
   *
   * @param sharesSignal - Signal containing the current WebShare shares array
   * @param excludeId - ID of the share to exclude from validation (when editing)
   * @returns AsyncValidatorFn that returns validation errors if nesting conflicts exist
   */
  validateWebSharePathNesting(
    sharesSignal: Signal<WebShare[]>,
    excludeId: number | null = null,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // Use debounce and distinctUntilChanged to avoid excessive API calls
      return of(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!value) {
            return of(null);
          }

          const shares = sharesSignal();
          const newPath = value as string;

          // Filter out the share being edited
          const otherShares = shares.filter((share) => share.id !== excludeId);

          // Check for nesting conflicts
          for (const share of otherShares) {
            const existingPath = share.path;

            // Check if new path is inside an existing WebShare
            if (newPath.startsWith(existingPath + '/')) {
              return of({
                pathNested: {
                  message: this.translate.instant(
                    helptextSharingWebshare.validation_errors.path_nested,
                    { name: share.name, path: existingPath },
                  ),
                },
              });
            }

            // Check if existing WebShare would be inside the new path
            if (existingPath.startsWith(newPath + '/')) {
              return of({
                pathContainsExisting: {
                  message: this.translate.instant(
                    helptextSharingWebshare.validation_errors.path_contains_existing,
                    { name: share.name, path: existingPath },
                  ),
                },
              });
            }
          }

          // Validate the path exists on the server
          return this.api.call('filesystem.stat', [newPath]).pipe(
            map((): null => null),
            catchError(() => of({
              pathNotFound: {
                message: this.translate.instant('Path does not exist'),
              },
            })),
          );
        }),
      );
    };
  }
}
