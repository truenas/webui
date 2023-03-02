import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services';

@Injectable()
export class ErrorHandlerService implements ErrorHandler {
  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleError(error: any): void {
    if (this.isTypeOfWebsocketError(error)) {
      const errors = this.parseWsError(error);
      this.dialog.error(errors);
      return;
    }
    if (this.isTypeOfJobError(error)) {
      const errors = this.parseJobError(error);
      this.dialog.error(errors);
      return;
    }
    console.error('Error', error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isTypeOfWebsocketError(obj: any): boolean {
    return 'error' in obj
    && 'extra' in obj
    && 'reason' in obj
    && 'trace' in obj;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isTypeOfJobError(obj: any): boolean {
    return 'state' in obj
    || 'error' in obj
    || 'exception' in obj
    || 'exc_info' in obj;
  }

  /**
   * @param error
   * @param formGroup
   * @param fieldsMap Overrides backend field names with frontend field names.
   * TODO: See if second `string` in fieldsMap can be typed to key of formGroup.
   */
  handleWsFormError(
    error: WebsocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string> = {},
  ): void {
    if ('type' in error && error.type === ResponseErrorType.Validation && error.extra) {
      this.handleValidationError(error, formGroup, fieldsMap);
      return;
    }

    if ('exc_info' in error && error.exc_info.type === ResponseErrorType.Validation && error.exc_info.extra) {
      this.handleValidationError({ ...error, extra: error.exc_info.extra as Job['extra'] }, formGroup, fieldsMap);
      return;
    }

    // Fallback to old error handling
    this.dialog.error(this.parseErrorOrJob(error));
  }

  private handleValidationError(
    error: WebsocketError | Job,
    formGroup: UntypedFormGroup,
    fieldsMap: Record<string, string>,
  ): void {
    for (const extraItem of (error as WebsocketError).extra) {
      const field = extraItem[0].split('.')[1];
      const errorMessage = extraItem[1];

      const control = this.getFormField(formGroup, field, fieldsMap);
      if (!control) {
        console.error(`Could not find control ${field}.`);
        // Fallback to default modal error message.
        this.dialog.error(this.parseErrorOrJob(error));
        return;
      }

      control.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: errorMessage,
        ixManualValidateError: { message: errorMessage },
      });
      control.markAsTouched();
    }
  }

  reportWsError(error: WebsocketError): Observable<boolean> {
    return this.dialog.error(this.parseWsError(error));
  }

  parseWsError(error: WebsocketError): ErrorReport | ErrorReport[] {
    return this.parseErrorOrJob(error);
  }

  reportJobError(failedJob: Job): Observable<boolean> {
    return this.dialog.error(this.parseJobError(failedJob));
  }

  parseJobError(failedJob: Job): ErrorReport | ErrorReport[] {
    if (failedJob.exc_info?.extra) {
      failedJob.extra = failedJob.exc_info.extra as Record<string, unknown>;
    }

    if (failedJob.extra && Array.isArray(failedJob.extra)) {
      const errors: ErrorReport[] = [];
      failedJob.extra.forEach((extraItem: [string, unknown]) => {
        const field = extraItem[0].split('.')[1];
        const error = extraItem[1] as string | WebsocketError | Job;
        const parsedError = this.parseErrorOrJob(error);
        parsedError.title = field + ': ' + parsedError.title;
        errors.push(parsedError);
      });
      return errors;
    }

    return {
      title: failedJob.state,
      message: failedJob.error,
      backtrace: failedJob.exception,
    };
  }

  private parseErrorOrJob(errorOrJob: WebsocketError | Job | string): ErrorReport {
    if (typeof errorOrJob === 'object') {
      if ('trace' in errorOrJob && errorOrJob.trace?.formatted) {
        return {
          title: errorOrJob.trace.class,
          message: errorOrJob.reason,
          backtrace: errorOrJob.trace.formatted,
        };
      }

      if ('state' in errorOrJob && errorOrJob.error && errorOrJob.exception) {
        return {
          title: errorOrJob.state,
          message: errorOrJob.error,
          backtrace: errorOrJob.exception,
        };
      }
    }
    return {
      title: this.translate.instant('Error'),
      message: errorOrJob as string,
    };
  }

  private handleObjError(error: HttpErrorResponse): ErrorReport[] {
    const errors: ErrorReport[] = [];
    Object.keys(error.error).forEach((i) => {
      const field = error.error[i];
      if (typeof field === 'string') {
        errors.push({
          title: this.translate.instant('Error'),
          message: field,
        });
      } else {
        (field as string[]).forEach((item: string) => {
          errors.push({
            title: this.translate.instant('Error'),
            message: item,
          });
        });
      }
    });
    return errors;
  }

  parseHttpError(error: HttpErrorResponse): ErrorReport | ErrorReport[] {
    if (error.status === 409) {
      this.handleObjError(error);
    } else if (error.status === 400) {
      if (typeof error.error === 'object') {
        this.handleObjError(error);
      } else {
        return {
          title: this.translate.instant('Error ({code})', { code: error.status }),
          message: error.error,
        };
      }
    } else if (error.status === 500) {
      if (error.error.error_message) {
        return {
          title: this.translate.instant('Error ({code})', { code: error.status }),
          message: error.error.error_message,
        };
      }
      return {
        title: this.translate.instant('Error ({code})', { code: error.status }),
        message: 'Server error: ' + error.error,
      };
    }
    console.error('Unknown error code', error.status);
    return {
      title: this.translate.instant('Error ({code})', { code: error.status }),
      message: this.translate.instant('Fatal error! Check logs.'),
    };
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
