import { v28_0_0 } from '@truenas/api-client';
import {
  catchError, map, Observable, throwError,
} from 'rxjs';
import { JsonRpcErrorCode } from 'app/enums/api.enum';
import { isApiCallError } from 'app/helpers/api.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ZpoolListEntry } from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * Lists pools with `zpool.list`, which replaces `zpool.query` in middleware NAS-141300.
 *
 * TODO: Drop the `zpool.query` fallback once NAS-141300 is on every master appliance. Until then an
 * appliance built before it answers `zpool.list` with "Method not found", and the pools are read
 * with `zpool.query` instead, its integer guid turned into the string `zpool.list` returns.
 */
export function listZpools(api: ApiService, query: v28_0_0.ZPoolQuery): Observable<ZpoolListEntry[]> {
  return api.callUndeclared('zpool.list', [query]).pipe(
    catchError((error: unknown) => {
      if (!isApiCallError(error) || error.error.code !== JsonRpcErrorCode.MethodNotFound) {
        return throwError(() => error);
      }

      return api.call('zpool.query', [query]).pipe(
        map((zpools) => zpools.map((zpool) => ({ ...zpool, guid: String(zpool.guid) }))),
      );
    }),
  );
}
