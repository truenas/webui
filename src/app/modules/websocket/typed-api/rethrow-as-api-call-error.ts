import { TrueNasApiError } from '@truenas/api-client';
import {
  catchError, MonoTypeOperatorFunction, throwError,
} from 'rxjs';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ApiCallError } from 'app/services/errors/error.classes';

/**
 * Rethrows the client's `TrueNasApiError` as the app's `ApiCallError`, carrying
 * the whole JSON-RPC error: `errname` drives authentication handling, `extra`
 * carries field-level validation errors and `trace` is what the error dialog
 * shows. `ErrorHandlerService` and form validation read it from there.
 *
 * The cast narrows only `code` and `errname`, which the client types as a number and a string
 * and the UI reads as its `JsonRpcErrorCode` and `ApiErrorName` enums.
 *
 * Any other error, such as a connection failure or `FailedJobError`, passes
 * through untouched.
 *
 * Shared by `ApiService` and its spec double, so a spec that answers with
 * an error frame sees the same `ApiCallError` production does.
 */
export function rethrowAsApiCallError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    if (error instanceof TrueNasApiError) {
      return throwError(() => new ApiCallError(error.frame as JsonRpcError));
    }

    return throwError(() => error);
  });
}
