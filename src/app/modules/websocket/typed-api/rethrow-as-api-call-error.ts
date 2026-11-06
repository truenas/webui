import { TrueNasApiError } from '@truenas/api-client';
import {
  catchError, MonoTypeOperatorFunction, throwError,
} from 'rxjs';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ApiCallError } from 'app/services/errors/error.classes';

/**
 * Rethrows the client's `TrueNasApiError` as `ApiCallError` with the whole JSON-RPC error: `errname`
 * drives auth handling, `extra` holds field errors, `trace` feeds the error dialog. The cast only
 * narrows `code` and `errname` to the UI's enums. Other errors pass through. Shared with the spec
 * double so specs see the same error as production.
 */
export function rethrowAsApiCallError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    if (error instanceof TrueNasApiError) {
      return throwError(() => new ApiCallError(error.frame as JsonRpcError));
    }

    return throwError(() => error);
  });
}
