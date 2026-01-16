import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService implements ErrorHandler {
  private injector = inject(Injector);
  private translate = inject(TranslateService);
  private errorParser = inject(ErrorParserService);

  private dialogService: DialogService;

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

  handleError(error: unknown): void {
    this.logError(error);
  }

  private logError(error: unknown): void {
    try {
      console.error(error);
    } catch (handlerError) {
      console.error('Failed to log error:', handlerError);
    }
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
      this.logError(error);

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
