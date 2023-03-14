import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import { Observable } from 'rxjs';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { sentryCustomExceptionExtraction } from 'app/helpers/error-parser.helper';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService implements ErrorHandler {
  private dialogService: DialogService;
  private translateService: TranslateService;
  get translate(): TranslateService {
    if (!this.translateService) {
      this.translateService = this.injector.get(TranslateService);
    }
    return this.translate;
  }

  get dialog(): DialogService {
    if (!this.dialogService) {
      this.dialogService = this.injector.get(DialogService);
    }
    return this.dialogService;
  }
  constructor(private injector: Injector) { }

  handleError(error: unknown): void {
    console.error(error);
    let errors: ErrorReport | ErrorReport[];
    if (this.isTypeOfWebsocketError(error)) {
      errors = this.parseWsError(error);
      Sentry.captureException(errors);
      this.dialog?.error(errors);
      return;
    }
    if (this.isTypeOfJobError(error)) {
      errors = this.parseJobError(error);
      Sentry.captureException(errors);
      this.dialog?.error(errors);
      return;
    }
    sentryCustomExceptionExtraction(error);
  }

  isTypeOfWebsocketError(error: unknown): error is WebsocketError {
    return typeof error === 'object'
      && 'error' in error
      && 'extra' in error
      && 'reason' in error
      && 'trace' in error;
  }

  isTypeOfJobError(obj: unknown): obj is Job {
    return typeof obj === 'object'
    && ('state' in obj
      && 'error' in obj
      && 'exception' in obj
      && 'exc_info' in obj);
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

  reportError(error: WebsocketError | Job): Observable<boolean> {
    return this.dialog.error(this.parseErrorOrJob(error));
  }

  parseWsError(error: WebsocketError): ErrorReport {
    return {
      title: error.trace.class,
      message: error.reason,
      backtrace: error.trace.formatted,
    };
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

        let parsedError: ErrorReport | ErrorReport[];
        if (this.isTypeOfWebsocketError(error)) {
          parsedError = this.parseWsError(error);
        } else if (this.isTypeOfJobError(error)) {
          parsedError = this.parseJobError(error);
        } else if (typeof error === 'string') {
          parsedError = {
            title: this.translate?.instant('Error') || 'Error',
            message: error,
          };
        }

        if (Array.isArray(parsedError)) {
          for (const err of parsedError) {
            err.title = field + ': ' + err.title;
            errors.push(err);
          }
        } else {
          parsedError.title = field + ': ' + parsedError.title;
          errors.push(parsedError);
        }
      });
      return errors;
    }

    return {
      title: failedJob.state,
      message: failedJob.error,
      backtrace: failedJob.exception,
    };
  }

  private parseErrorOrJob(errorOrJob: WebsocketError | Job | string): ErrorReport | ErrorReport[] {
    if (typeof errorOrJob === 'object') {
      if ('trace' in errorOrJob && errorOrJob.trace?.formatted) {
        return this.parseWsError(errorOrJob);
      }

      if ('state' in errorOrJob && errorOrJob.error && errorOrJob.exception) {
        return this.parseJobError(errorOrJob);
      }
    }
    return {
      title: this.translate?.instant('Error') || 'Error',
      message: errorOrJob as string,
    };
  }

  private handleObjError(error: HttpErrorResponse): ErrorReport[] {
    const errors: ErrorReport[] = [];
    Object.keys(error.error).forEach((i) => {
      const field = error.error[i];
      if (typeof field === 'string') {
        errors.push({
          title: this.translate?.instant('Error') || 'Error',
          message: field,
        });
      } else {
        (field as string[]).forEach((item: string) => {
          errors.push({
            title: this.translate?.instant('Error') || 'Error',
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
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: error.error,
        };
      }
    } else if (error.status === 500) {
      if (error.error.error_message) {
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: error.error.error_message,
        };
      }
      return {
        title: this.translate?.instant('Error ({code})', { code: error.status })
          || `Error (${error.status})`,
        message: this.translate?.instant('Server error: {error}', { error: error.error })
          || `Server error: ${error.error}`,
      };
    }
    console.error(this.translate?.instant('Unknown error code') || 'Unknown error code', error.status);
    return {
      title: this.translate?.instant('Error ({code})', { code: error.status })
        || `Error (${error.status})`,
      message: this.translate?.instant('Fatal error! Check logs.') || 'Fatal error! Check logs.',
    };
  }

  private getFormField(formGroup: UntypedFormGroup, field: string, fieldsMap: Record<string, string>): AbstractControl {
    const fieldName = fieldsMap[field] ?? field;
    return formGroup.get(fieldName);
  }
}
