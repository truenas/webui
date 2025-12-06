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
      // Filter out the share being edited (use explicit null check to handle id=0 edge case)
      const otherShares = excludeId !== null
        ? shares.filter((share) => share.id !== excludeId)
        : shares;

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

  /**
   * Validates that a WebShare path is valid and not a root dataset.
   *
   * Rules enforced:
   * 1. Path must be under /mnt/
   * 2. Path cannot be a root dataset (e.g., /mnt/pool)
   * 3. Path must be a subdirectory (e.g., /mnt/pool/dataset)
   *
   * Examples:
   * - /mnt/pool          → REJECTED (root dataset)
   * - /mnt/pool/         → REJECTED (root dataset with trailing slash)
   * - /mnt/pool//dataset → ACCEPTED (multiple slashes normalized)
   * - /mnt/pool/dataset  → ACCEPTED (valid subdirectory)
   * - /etc/passwd        → REJECTED (not under /mnt/)
   * - /mnt/../etc        → REJECTED (path traversal)
   */
  validateWebSharePath(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputPath = control.value as string;

      // Normalize the path by resolving . and .. segments and removing trailing slashes
      // This prevents path traversal attacks and ensures consistent validation
      const normalizedPath = this.normalizePath(inputPath);

      // After normalization, check if path is still under /mnt/
      if (!normalizedPath.startsWith('/mnt/')) {
        return {
          pathInvalid: {
            message: this.translate.instant(helptextSharingWebshare.validation_errors.path_invalid),
          },
        };
      }

      // Check if it's a root dataset (e.g., /mnt/pool)
      // Remove the '/mnt/' prefix (5 characters) and split by '/'
      // Filter out empty strings which come from multiple consecutive slashes
      // Example: '/mnt/pool' → 'pool' → ['pool'] → length 1 (REJECTED)
      // Example: '/mnt/pool/dataset' → 'pool/dataset' → ['pool', 'dataset'] → length 2 (ACCEPTED)
      // Example: '/mnt/pool//dataset' → 'pool//dataset' → ['pool', '', 'dataset']
      //          → ['pool', 'dataset'] → length 2 (ACCEPTED)
      const pathParts = normalizedPath.substring(5).split('/').filter((part) => part.length > 0);
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
   * Normalizes a path by resolving . and .. segments.
   * This prevents path traversal attacks like /mnt/../etc/passwd
   */
  private normalizePath(inputPath: string): string {
    // Remove trailing slashes
    const path = inputPath.replace(/\/+$/, '');

    // Split path into segments
    const segments = path.split('/');
    const normalized: string[] = [];

    for (const segment of segments) {
      if (segment === '' || segment === '.') {
        // Skip empty segments and current directory references
        continue;
      } else if (segment === '..') {
        // Go up one directory (remove last segment if possible)
        if (normalized.length > 0) {
          normalized.pop();
        }
      } else {
        // Regular directory name
        normalized.push(segment);
      }
    }

    // Reconstruct path (ensure it starts with /)
    return '/' + normalized.join('/');
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

          // Filter out the share being edited (use explicit null check to handle id=0 edge case)
          const otherShares = excludeId !== null
            ? shares.filter((share) => share.id !== excludeId)
            : shares;

          // Check for nesting conflicts
          for (const share of otherShares) {
            // Normalize existing path by removing trailing slashes
            const existingPath = share.path.replace(/\/+$/, '');

            // Check for exact path match first
            if (newPath === existingPath) {
              return of({
                pathNested: {
                  message: this.translate.instant(
                    helptextSharingWebshare.validation_errors.path_nested,
                    { name: share.name, path: existingPath },
                  ),
                },
              });
            }

            // Check if new path is inside an existing WebShare
            // Using startsWith with '/' ensures we don't match partial directory names
            // e.g., /mnt/tank/foo doesn't match /mnt/tank/foobar
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
                message: this.translate.instant(helptextSharingWebshare.validation_errors.path_not_found),
              },
            })),
          );
        }),
      );
    };
  }
}
