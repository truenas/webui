import { inject, Injectable, Type } from '@angular/core';
import {
  BehaviorSubject, Observable, of, shareReplay, switchMap, tap,
} from 'rxjs';
import {
  TypedQueryFilter, WebUiQueryEntity, WebUiQueryMethod,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

export interface GlobalStoreMembers<M extends WebUiQueryMethod> {
  call: Observable<WebUiQueryEntity<M>[]>;
  invalidate: () => void;
}

/**
 * A root-provided cache of one query's rows: the first subscriber sends the query, later ones get
 * the cached rows until `invalidate()`.
 */
export function globalStore<M extends WebUiQueryMethod>(
  method: M,
  filters?: TypedQueryFilter<WebUiQueryEntity<M>>[],
): Type<GlobalStoreMembers<M>> {
  @Injectable({ providedIn: 'root' })
  class GlobalStore implements GlobalStoreMembers<M> {
    private api = inject(TypedApiService);
    private callResult$ = new BehaviorSubject<WebUiQueryEntity<M>[] | undefined>(undefined);
    private callInFlight$: Observable<WebUiQueryEntity<M>[]> | null = null;

    get call(): Observable<WebUiQueryEntity<M>[]> {
      return this.callResult$.pipe(
        switchMap((callResult) => {
          if (callResult === undefined) {
            if (!this.callInFlight$) {
              this.callInFlight$ = this.api
                .query(method, filters)
                .pipe(
                  tap((result) => {
                    this.callResult$.next(result);
                    this.callInFlight$ = null;
                  }),
                  shareReplay({ bufferSize: 1, refCount: false }),
                );
            }
            return this.callInFlight$;
          }
          return of(callResult);
        }),
      );
    }

    invalidate(): void {
      this.callResult$.next(undefined);
      this.callInFlight$ = null;
    }
  }
  return GlobalStore;
}
