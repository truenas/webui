import { Injectable, Signal } from '@angular/core';
import {
  AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable()
export class WebShareValidatorService {
  constructor(
    private api: ApiService,
    private translate: TranslateService,
  ) {}

  validateWebShareName(configSignal: Signal<WebShareConfig | null>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const config = configSignal();
      if (!config?.altroots) {
        return of(null);
      }

      const nameExists = Object.keys(config.altroots).includes(control.value as string);
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

  validateWebSharePathNesting(
    configSignal: Signal<WebShareConfig | null>,
    excludeName: string | null = null,
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const config = configSignal();
      if (!config?.altroots) {
        return of(null);
      }

      const newPath = control.value as string;
      const altroots = { ...config.altroots };

      // Remove the current WebShare if we're editing
      if (excludeName) {
        delete altroots[excludeName];
      }

      // Check for nesting conflicts
      for (const [name, existingPath] of Object.entries(altroots)) {
        // Check if new path is inside an existing WebShare
        if (newPath.startsWith(existingPath + '/') || newPath === existingPath) {
          return of({
            pathNested: {
              message: this.translate.instant(
                helptextSharingWebshare.validation_errors.path_nested,
                { name, path: existingPath },
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
                { name, path: existingPath },
              ),
            },
          });
        }
      }

      // Validate the path exists on the server
      return this.api.call('filesystem.stat', [newPath]).pipe(
        map(() => null),
        catchError(() => of({
          pathNotFound: {
            message: this.translate.instant('Path does not exist'),
          },
        })),
      );
    };
  }
}
