import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take,
} from 'rxjs';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class PoolWizardNameValidationService {
  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) { }

  private errorMessage = this.translate.instant('Invalid pool name (please refer to <a href="https://openzfs.github.io/openzfs-docs/man/8/zpool-create.8.html#DESCRIPTION" target="_blank">the documentation</a> for valid rules for pool name)');

  validatePoolName = (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      take(1),
      switchMap((value) => {
        return this.api.call('pool.validate_name', [value]).pipe(
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
          catchError((error: unknown) => {
            const errorReports = this.errorHandler.parseError(error) as ErrorReport;
            return of({
              customValidator: {
                message: errorReports?.message || this.translate.instant('Error validating pool name'),
              },
              invalidPoolName: true,
            });
          }),
        );
      }),
    );
  };
}
