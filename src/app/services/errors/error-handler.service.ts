import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector, NgZone, inject } from '@angular/core';
import { NavigationError } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';
import { consoleSandbox } from '@sentry/utils';
import {
  catchError, EMPTY, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import {
  isApiCallError, isFailedJobError,
} from 'app/helpers/api.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends Sentry.SentryErrorHandler implements ErrorHandler {
  private injector = inject(Injector);
  private translate = inject(TranslateService);
  private errorParser = inject(ErrorParserService);
  private zone = inject(NgZone);

  private dialogService: DialogService;

  private isSentryAllowed = true;

  protected readonly genericError = {
    title: this.translate.instant('Error'),
    message: this.translate.instant('An unknown error occurred'),
  };

  protected readonly errorHandlingError = {
    title: this.translate.instant('Error'),
    message: this.translate.instant('Something went wrong while handling an error.'),
  };

  get dialog(): DialogService {
    if (!this.dialogService) {
      this.dialogService = this.injector.get(DialogService);
    }
    return this.dialogService;
  }

  constructor() {
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
    try {
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
    } catch (handlerError) {
      console.error('Failed to log error to Sentry:', handlerError);
    }
  }

  private shouldLogToSentry(error: unknown): boolean {
    const isNetworkError = String(error) === '[object CloseEvent]' // Ws connection closed
      || error instanceof HttpErrorResponse // Generic network error
      || (error instanceof NavigationError && String(error.error).includes('Failed to fetch')); // Failed to load route.

    if (isNetworkError) {
      return false;
    }

    const isMiddlewareError = isApiCallError(error) || isFailedJobError(error);
    if (isMiddlewareError) {
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
    try {
      this.logError(error, true);

      if (!this.shouldShowErrorModal(error)) {
        return EMPTY;
      }

      const errorReport = this.errorParser.parseError(error);
      return this.dialog.error(errorReport || this.genericError);
    } catch {
      return this.dialog.error(this.errorHandlingError);
    }
  }

  private shouldShowErrorModal(error: unknown): boolean {
    if (String(error) === '[object CloseEvent]') {
      return false;
    }

    return true;
  }
}
