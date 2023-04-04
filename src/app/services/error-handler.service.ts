import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import { Observable } from 'rxjs';
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
    return this.translateService;
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
    const parsedError = this.parseError(error);
    if (parsedError) {
      this.dialog?.error(parsedError);
    } else {
      this.logToSentry(error);
    }
  }

  parseError(error: unknown): ErrorReport | ErrorReport[] {
    if (this.isTypeOfWebsocketError(error)) {
      return this.parseWsError(error);
    }
    if (this.isTypeOfJobError(error)) {
      return this.parseJobError(error);
    }
    return null;
  }

  logToSentry(error: unknown): void {
    Sentry.captureException(sentryCustomExceptionExtraction(error));
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

  reportError(error: WebsocketError | Job): Observable<boolean> {
    return this.dialog.error(this.parseErrorOrJob(error));
  }

  parseWsError(error: WebsocketError): ErrorReport {
    return {
      title: error.type || error.trace.class,
      message: error.reason,
      backtrace: error.trace.formatted,
    };
  }

  parseJobError(failedJob: Job): ErrorReport | ErrorReport[] {
    const errorJob = { ...failedJob };
    if (errorJob.exc_info?.extra) {
      errorJob.extra = errorJob.exc_info.extra as Record<string, unknown>;
    }

    if (errorJob.extra && Array.isArray(errorJob.extra)) {
      const errors: ErrorReport[] = [];
      errorJob.extra.forEach((extraItem: [string, unknown]) => {
        const field = extraItem[0].split('.')[1];
        const extractedError = extraItem[1] as string | WebsocketError | Job;

        let parsedError: ErrorReport | ErrorReport[];
        if (this.isTypeOfWebsocketError(extractedError)) {
          parsedError = this.parseWsError(extractedError);
        } else if (this.isTypeOfJobError(extractedError)) {
          parsedError = this.parseJobError(extractedError);
        } else if (typeof extractedError === 'string') {
          parsedError = {
            title: (this.translate?.instant('Error') || 'Error'),
            message: extractedError,
            backtrace: errorJob.exception,
          };
        }

        if (Array.isArray(parsedError)) {
          for (const err of parsedError) {
            if (err.title === (this.translate?.instant('Error') || 'Error')) {
              err.title = err.title + ': ' + field;
            } else {
              err.title = field + ': ' + err.title;
            }
            errors.push(err);
          }
        } else {
          if (parsedError.title === (this.translate?.instant('Error') || 'Error')) {
            parsedError.title = parsedError.title + ': ' + field;
          } else {
            parsedError.title = field + ': ' + parsedError.title;
          }
          errors.push(parsedError);
        }
      });
      return errors;
    }

    return {
      title: errorJob.state,
      message: errorJob.error,
      backtrace: errorJob.exception,
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
