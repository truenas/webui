import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorHandler, Injectable, Injector, NgZone,
} from '@angular/core';
import { NavigationError } from '@angular/router';
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
import { AbortedJobError } from 'app/services/errors/error.classes';

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

    const extractedError = this._extractError(error);

    if (!extractedError) {
      // No point in logging unknown errors.
      return;
    }

    this.zone.runOutsideAngular(() => Sentry.captureException(extractedError, {
      mechanism: { type: 'angular', handled: wasErrorHandled },
    }));
  }

  private shouldLogToSentry(error: unknown): boolean {
    const isNetworkError = String(error) === '[object CloseEvent]' // Ws connection closed
      || error instanceof HttpErrorResponse // Generic network error
      || (error instanceof NavigationError && String(error.error).includes('Failed to fetch')); // Failed to load route.

    if (isNetworkError) {
      return false;
    }

    if (error instanceof AbortedJobError) {
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

    if (!this.shouldShowErrorModal(error)) {
      return EMPTY;
    }

    try {
      const errorReport = this.errorParser.parseError(error);
      return this.dialog.error(errorReport || {
        title: this.translate.instant('Error'),
        message: this.translate.instant('An unknown error occurred'),
      });
    } catch (handlerError) {
      this.logError(handlerError, true);

      return this.dialog.error({
        title: this.translate.instant('Error'),
        message: this.translate.instant('Something went wrong while handling an error.'),
      });
    }
  }

  private shouldShowErrorModal(error: unknown): boolean {
    if (String(error) === '[object CloseEvent]') {
      return false;
    }

    return true;
  }
}
