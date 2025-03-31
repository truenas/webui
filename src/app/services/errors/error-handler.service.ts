import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorHandler, Injectable, Injector, NgZone,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
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
export class ErrorHandlerService extends Sentry.SentryErrorHandler implements ErrorHandler {
  private dialogService: DialogService;

  private isSentryAllowed = true;

  get dialog(): DialogService {
    if (!this.dialogService) {
      this.dialogService = this.injector.get(DialogService);
    }
    return this.dialogService;
  }

  constructor(
    private injector: Injector,
    private translate: TranslateService,
    private errorParser: ErrorParserService,
    private zone: NgZone,
  ) {
    super({
      logErrors: false,
    });
  }

  /**
   * Sentry collects errors by default, but their sending
   * may be delayed or cancelled based on whether error reporting is allowed.
   *
   * See waitForConsent$
   */
  disableSentry(): void {
    this.isSentryAllowed = false;
    Sentry.endSession();
  }

  override handleError(error: unknown): void {
    this.logError(error);
  }

  private logError(error: unknown, wasErrorHandled = false): void {
    consoleSandbox(() => {
      // Prevents Sentry from logging the same error twice.
      console.error(error);
    });

    if (!this.isSentryAllowed || !this.shouldLogToSentry(error)) {
      return;
    }

    const extractedError = this._extractError(error) || `No additional data available for error: ${JSON.stringify(error)}`;

    this.zone.runOutsideAngular(() => Sentry.captureException(extractedError, {
      mechanism: { type: 'angular', handled: wasErrorHandled },
    }));
  }

  private shouldLogToSentry(error: unknown): boolean {
    if (String(error) === '[object CloseEvent]') {
      return false;
    }

    if (error instanceof HttpErrorResponse) {
      return false;
    }

    const ignoredApiErrors = [
      ApiErrorName.Validation,
      ApiErrorName.Again,
      ApiErrorName.NoMemory,
      ApiErrorName.NotAuthenticated,
    ] as unknown[];

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
    const errorReport = this.errorParser.parseError(error);
    return this.dialog.error(errorReport || {
      title: this.translate.instant('Error'),
      message: this.translate.instant('An unknown error occurred'),
    });
  }
}
