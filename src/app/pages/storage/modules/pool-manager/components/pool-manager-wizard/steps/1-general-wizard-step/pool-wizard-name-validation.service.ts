import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take,
} from 'rxjs';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class PoolWizardNameValidationService {
  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
  ) { }

  private errorMessage = this.translate.instant('Invalid pool name (please refer to <a href="https://openzfs.github.io/openzfs-docs/man/8/zpool-create.8.html#DESCRIPTION" target="_blank">the documentation</a> for valid rules for pool name)');

  validatePoolName = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      take(1),
      switchMap((value) => {
        return this.ws.call('pool.validate_name', [value]).pipe(
          catchError(() => {
            return of({
              customValidator: {
                message: this.errorMessage,
              },
              invalidPoolName: true,
            });
          }),
          switchMap((isValid) => {
            return isValid === true
              ? of(null)
              : of({
                customValidator: {
                  message: this.errorMessage,
                },
                invalidPoolName: true,
              });
          }),
        );
      }),
    );
  };
}
