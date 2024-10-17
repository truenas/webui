import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import {
  catchError, EMPTY, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import { sentryCustomExceptionExtraction } from 'app/helpers/error-parser.helper';
import { isWebSocketError } from 'app/helpers/websocket.helper';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';

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

    if (!this.shouldLogToSentry(error)) {
      return;
    }

    this.logToSentry(error);
  }

  parseError(error: unknown): ErrorReport | ErrorReport[] {
    if (this.isWebSocketError(error)) {
      return this.parseWsError(error);
    }
    if (this.isJobError(error)) {
      return this.parseJobError(error);
    }
    if (this.isHttpError(error)) {
      return this.parseHttpError(error);
    }
    if (error instanceof Error) {
      return {
        title: this.translate?.instant('Error') || 'Error',
        message: error.message,
      };
    }

    return null;
  }

  logToSentry(error: unknown): void {
    Sentry.captureException(sentryCustomExceptionExtraction(error));
  }

  isWebSocketError(error: unknown): error is WebSocketError {
    return isWebSocketError(error);
  }

  isJobError(obj: unknown): obj is Job {
    return typeof obj === 'object'
      && ('state' in obj
        && 'error' in obj
        && 'exception' in obj
        && 'exc_info' in obj);
  }

  isHttpError(obj: unknown): obj is HttpErrorResponse {
    return obj instanceof HttpErrorResponse;
  }

  catchError<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => {
      return source$.pipe(
        catchError((error: unknown) => {
          this.showErrorModal(error);
          return EMPTY;
        }),
      );
    };
  }

  showErrorModal(error: unknown): void {
    this.dialog.error(this.parseError(error));
  }

  private parseWsError(error: WebSocketError): ErrorReport {
    return {
      title: error.type || error.trace?.class || this.translate.instant('Error'),
      message: error.reason || error?.error?.toString(),
      backtrace: error.trace?.formatted || '',
    };
  }

  private parseJobError(failedJob: Job): ErrorReport | ErrorReport[] {
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
      backtrace: errorJob.logs_excerpt || errorJob.exception,
    };
  }

  private parseJobWithArrayExtra(errorJob: Job): ErrorReport[] {
    const errors: ErrorReport[] = [];
    (errorJob.extra as unknown as unknown[]).forEach((extraItem: [string, unknown]) => {
      const field = extraItem[0].split('.')[1];
      const extractedError = extraItem[1] as string | WebSocketError | Job;

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
    extractedError: string | WebSocketError | Job,
  ): ErrorReport | ErrorReport[] {
    let parsedError: ErrorReport | ErrorReport[];
    if (this.isWebSocketError(extractedError)) {
      parsedError = this.parseWsError(extractedError);
    } else if (this.isJobError(extractedError)) {
      parsedError = this.parseJobError(extractedError);
    } else if (typeof extractedError === 'string') {
      parsedError = {
        title: (this.translate?.instant('Error') || 'Error'),
        message: extractedError,
        backtrace: errorJob.logs_path || errorJob.exception,
      };
    }
    return parsedError;
  }

  private parseHttpErrorObject(error: HttpErrorResponse): ErrorReport[] {
    const errors: ErrorReport[] = [];
    Object.keys(error.error as Record<string, string | string[]>).forEach((fieldKey) => {
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
    console.error(error);
    switch (error.status) {
      case 401:
      case 403:
      case 404: {
        return {
          title: error.statusText,
          message: error.message,
        };
      }
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
          message: this.translate?.instant('Server error: {error}', { error: error.message || error.error })
            || `Server error: ${error.message || error.error}`,
        };
      }
      default: {
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: error.message || this.translate?.instant('Fatal error! Check logs.') || 'Fatal error! Check logs.',
        };
      }
    }
  }

  private shouldLogToSentry(error: unknown): boolean {
    if (error instanceof CloseEvent) {
      return false;
    }

    return true;
  }
}
