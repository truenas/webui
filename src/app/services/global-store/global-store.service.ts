import { inject, Injectable, Type } from '@angular/core';
import {
  BehaviorSubject, Observable, of, switchMap, tap,
} from 'rxjs';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventMethod, ApiEventTyped } from 'app/interfaces/api-message.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface GlobalStoreMembers<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
> {
  call: Observable<ApiCallResponse<M1>>;
  subscribe: Observable<ApiEventTyped<M2>>;
  callAndSubscribe: Observable<ApiCallAndSubscribeResponse<M3>[]>;
  invalidate: () => void;
}

export function globalStore<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
>(
  method: M1 | M2 | M3,
  params?: ApiCallParams<M1 | M3>,
): Type<GlobalStoreMembers<M1, M2, M3>> {
  @Injectable({ providedIn: 'root' })
  class GlobalStore implements GlobalStoreMembers<M1, M2, M3> {
    private api = inject(ApiService);
    private callResult$ = new BehaviorSubject<ApiCallResponse<M1>>(undefined);
    private subscribeResult$ = new BehaviorSubject<ApiEventTyped<M2> | undefined>(undefined);
    private callAndSubscribeResult$ = new BehaviorSubject<ApiCallAndSubscribeResponse<M3>[] | undefined>(undefined);

    get call(): Observable<ApiCallResponse<M1>> {
      return this.callResult$.pipe(
        switchMap((callResult) => {
          if (callResult === undefined) {
            return this.api
              .call(method as M1, params as ApiCallParams<M1>)
              .pipe(tap((result) => this.callResult$.next(result)));
          }
          return of(callResult);
        }),
      );
    }

    get subscribe(): Observable<ApiEventTyped<M2>> {
      return this.subscribeResult$.pipe(
        switchMap((subscribeResult) => {
          if (subscribeResult === undefined) {
            return this.api
              .subscribe(method as M2)
              .pipe(tap((result) => this.subscribeResult$.next(result)));
          }
          return of(subscribeResult);
        }),
      );
    }

    get callAndSubscribe(): Observable<ApiCallAndSubscribeResponse<M3>[]> {
      return this.callAndSubscribeResult$.pipe(
        switchMap((callAndSubscribeResult) => {
          if (callAndSubscribeResult === undefined) {
            return this.api
              .callAndSubscribe(method as M3, params as ApiCallParams<M3>)
              .pipe(tap((result) => this.callAndSubscribeResult$.next(result)));
          }
          return of(callAndSubscribeResult);
        }),
      );
    }

    invalidate(): void {
      this.callResult$.next(undefined);
      this.subscribeResult$.next(undefined);
      this.callAndSubscribeResult$.next(undefined);
    }
  }
  return GlobalStore;
}
