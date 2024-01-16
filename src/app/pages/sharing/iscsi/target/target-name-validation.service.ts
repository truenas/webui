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
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class TargetNameValidationService {
  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) { }

  errors = [
    this.translate.instant('Target with this name already exists'),
    this.translate.instant('Only lowercase alphanumeric characters plus dot (.), dash (-), and colon (:) are allowed.'),
  ];

  validateTargetName = (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      take(1),
      switchMap((value) => {
        return this.ws.call('iscsi.target.validate_name', [value]).pipe(
          switchMap((error) => {
            return error
              ? of({
                customValidator: {
                  message: this.getError(error) || error,
                },
                invalidTargetName: true,
              })
              : of(null);
          }),
          catchError((error) => {
            const errorReports = this.errorHandler.parseError(error) as ErrorReport;
            return of({
              customValidator: {
                message: errorReports?.message || this.translate.instant('Error validating target name'),
              },
              invalidTargetName: true,
            });
          }),
        );
      }),
    );
  };

  private getError(errorValue: string): string {
    return this.errors.find((error) => error === errorValue);
  }
}
