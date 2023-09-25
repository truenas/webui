import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import {
  Observable, catchError, MonoTypeOperatorFunction, EMPTY,
} from 'rxjs';
import { sentryCustomExceptionExtraction } from 'app/helpers/error-parser.helper';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';

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
      error = parsedError;
    }
    this.logToSentry(error);
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

  catchError<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => {
      return source$.pipe(
        catchError((error: WebsocketError | Job) => {
          this.dialog.error(this.parseErrorOrJob(error));
          return EMPTY;
        }),
      );
    };
  }

  parseWsError(error: WebsocketError): ErrorReport {
    return {
      title: error.type || error.trace?.class,
      message: error.reason || error?.error?.toString(),
      backtrace: error.trace?.formatted || '',
    };
  }

  parseJobError(failedJob: Job): ErrorReport | ErrorReport[] {
    const errorJob = { ...failedJob };
    if (errorJob.exc_info?.extra) {
      errorJob.extra = errorJob.exc_info.extra as Record<string, unknown>;
    }

    if (errorJob.extra && Array.isArray(errorJob.extra)) {
      return this.parseJobWithArrayExtra(errorJob);
    }

    return {
      title: errorJob.state,
      message: errorJob.error,
      backtrace: errorJob.exception,
    };
  }

  private parseJobWithArrayExtra(errorJob: Job): ErrorReport[] {
    const errors: ErrorReport[] = [];
    (errorJob.extra as unknown as unknown[]).forEach((extraItem: [string, unknown]) => {
      const field = extraItem[0].split('.')[1];
      const extractedError = extraItem[1] as string | WebsocketError | Job;

      const parsedError = this.parseJobExtractedError(errorJob, extractedError);

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

  private parseJobExtractedError(
    errorJob: Job,
    extractedError: string | WebsocketError | Job,
  ): ErrorReport | ErrorReport[] {
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
    return parsedError;
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

  private parseHttpErrorObject(error: HttpErrorResponse): ErrorReport[] {
    const errors: ErrorReport[] = [];
    Object.keys(error.error).forEach((fieldKey) => {
      const errorEntity = (error.error as Record<string, string | string[]>)[fieldKey];
      if (typeof errorEntity === 'string') {
        errors.push({
          title: this.translate?.instant('Error') || 'Error',
          message: errorEntity,
        });
      } else {
        errorEntity.forEach((item: string) => {
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
    switch (error.status) {
      case 409: {
        return this.parseHttpErrorObject(error);
      }
      case 400: {
        if (typeof error.error === 'object') {
          return this.parseHttpErrorObject(error);
        }
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
              || `Error (${error.status})`,
          message: String(error.error),
        };
      }
      case 500: {
        const errorMessage = (error.error as Record<string, string>)?.error_message;
        if (errorMessage) {
          return {
            title: this.translate?.instant('Error ({code})', { code: error.status })
              || `Error (${error.status})`,
            message: errorMessage,
          };
        }
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: this.translate?.instant('Server error: {error}', { error: error.error })
            || `Server error: ${error.error}`,
        };
      }
      default: {
        console.error(this.translate?.instant('Unknown error code') || 'Unknown error code', error.status);
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: this.translate?.instant('Fatal error! Check logs.') || 'Fatal error! Check logs.',
        };
      }
    }
  }
}
