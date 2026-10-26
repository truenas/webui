import { TrueNasApiError } from '@truenas/api-client';
import {
  catchError, MonoTypeOperatorFunction, throwError,
} from 'rxjs';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ApiCallError } from 'app/services/errors/error.classes';

/**
 * Rethrows the client's `TrueNasApiError` as the `ApiCallError` the legacy
 * `ApiService` throws, carrying the same whole JSON-RPC error: `errname`
 * drives authentication handling, `extra` carries field-level validation
 * errors and `trace` is what the error dialog shows. `ErrorHandlerService` and
 * form validation therefore read a typed refusal exactly as a legacy one.
 *
 * Any other error, such as a connection failure or `FailedJobError`, passes
 * through untouched.
 *
 * Shared by `TypedApiService` and its spec double, so a spec that answers with
 * an error frame sees the same `ApiCallError` production does.
 */
export function rethrowAsApiCallError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    if (error instanceof TrueNasApiError) {
      return throwError(() => new ApiCallError(error.frame as unknown as JsonRpcError));
    }

    return throwError(() => error);
  });
}
