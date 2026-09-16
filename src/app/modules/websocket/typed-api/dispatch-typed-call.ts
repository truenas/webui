import {
  defer, filter, finalize, Observable, of, switchMap, take, throwError,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ApiCallError } from 'app/services/errors/error.classes';

/**
 * The request/response round trip for a typed `call`, done over the raw
 * connection rather than through the client's `call` because the client
 * reduces a JSON-RPC error to its reason string, and the UI needs the whole
 * payload: `errname` drives authentication handling, `extra` carries
 * field-level validation errors.
 *
 * Shared by `TypedApiService` and its spec double, so a spec that answers with
 * an error frame sees the same `ApiCallError` production does.
 */
export function dispatchTypedCall<R>(
  client: Pick<WebUiApiClient, 'connection'>,
  method: string,
  params: unknown,
): Observable<R> {
  return defer(() => {
    const id = uuidv4();
    const reply$ = client.connection.messages().pipe(
      filter((message) => message.id === id),
      take(1),
      switchMap((message) => {
        if (message.error) {
          return throwError(() => new ApiCallError(message.error as unknown as JsonRpcError));
        }
        return of(message.result as R);
      }),
    );
    const sending = client.connection.send({
      jsonrpc: '2.0',
      id,
      method,
      params: params ?? [],
    });
    return reply$.pipe(finalize(() => sending.unsubscribe()));
  });
}
