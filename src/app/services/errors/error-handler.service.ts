import {
  ErrorHandler, Injectable, Injector, NgZone,
} from '@angular/core';
import { captureException, SentryErrorHandler } from '@sentry/angular';
import { consoleSandbox } from '@sentry/utils';
import {
  catchError, EMPTY, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import {
  isApiCallError, isFailedJobError,
} from 'app/helpers/api.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends SentryErrorHandler implements ErrorHandler {
  private dialogService: DialogService;

  get dialog(): DialogService {
    if (!this.dialogService) {
      this.dialogService = this.injector.get(DialogService);
    }
    return this.dialogService;
  }

  constructor(
    private injector: Injector,
    private errorParser: ErrorParserService,
    private zone: NgZone,
  ) {
    super({
      logErrors: false,
    });
  }

  override handleError(error: unknown): void {
    this.logError(error);
  }

  private logError(error: unknown, wasErrorHandled = false): void {
    consoleSandbox(() => {
      // Prevents Sentry from logging the same error twice.
      console.error(error);
    });

    if (!this.shouldLogToSentry(error)) {
      return;
    }

    const extractedError = this._extractError(error) || 'Unknown error';

    this.zone.runOutsideAngular(() => captureException(extractedError, {
      mechanism: { type: 'angular', handled: wasErrorHandled },
    }));
  }

  private shouldLogToSentry(error: unknown): boolean {
    if (error instanceof CloseEvent) {
      return false;
    }

    const ignoredApiErrors = [
      ApiErrorName.Validation,
      ApiErrorName.Again,
      ApiErrorName.NoMemory,
      ApiErrorName.NotAuthenticated,
    ];

    if (isApiCallError(error) && ignoredApiErrors.includes(error.error.data?.errname)) {
      return false;
    }

    if (isFailedJobError(error) && error.job.exc_info?.type === JobExceptionType.Validation) {
      return false;
    }

    return true;
  }

  withErrorHandler<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => {
      return source$.pipe(
        catchError((error: unknown) => {
          this.showErrorModal(error);
          return EMPTY;
        }),
      );
    };
  }

  showErrorModal(error: unknown): Observable<boolean> {
    this.logError(error, true);
    return this.dialog.error(this.errorParser.parseError(error));
  }
}
