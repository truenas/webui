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
export class TargetNameValidationService {
  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) { }

  private errors = [
    this.translate.instant('Target with this name already exists'),
    this.translate.instant('Only lowercase alphanumeric characters plus dot (.), dash (-), and colon (:) are allowed.'),
  ];

  validateTargetName = (originalName: string) => {
    return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
      return control.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        take(1),
        switchMap((value) => {
          if (control.value === originalName) {
            return of(null);
          }

          return this.api.call('iscsi.target.validate_name', [value]).pipe(
            catchError((error: unknown) => {
              const errorReports = this.errorHandler.parseError(error) as ErrorReport;
              return of({
                customValidator: {
                  message: errorReports?.message || this.translate.instant('Error validating target name'),
                },
                invalidTargetName: true,
              });
            }),
            switchMap((responseError: string) => {
              return responseError === null
                ? of(null)
                : of({
                  customValidator: {
                    message: this.getError(responseError) || responseError,
                  },
                  invalidTargetName: true,
                });
            }),
          );
        }),
      );
    };
  };

  private getError(errorValue: string): string {
    return this.errors.find((error) => error === errorValue);
  }
}
