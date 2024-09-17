import { inject, Injectable, Type } from '@angular/core';
import {
  BehaviorSubject, Observable, of, switchMap, tap,
} from 'rxjs';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventMethod, ApiEventTyped } from 'app/interfaces/api-message.interface';
import { WebSocketService } from 'app/services/ws.service';

interface GlobalStoreMembers<
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
    private ws = inject(WebSocketService);
    private callResult$ = new BehaviorSubject<ApiCallResponse<M1>>(undefined);
    private subscribeResult$ = new BehaviorSubject<ApiEventTyped<M2>>(undefined);
    private callAndSubscribeResult$ = new BehaviorSubject<ApiCallAndSubscribeResponse<M3>[]>(undefined);

    call = this.callResult$.pipe(
      switchMap((callResult) => {
        if (callResult === undefined) {
          return this.ws
            .call(method as M1, params as ApiCallParams<M1>)
            .pipe(tap((result) => this.callResult$.next(result)));
        }
        return of(callResult);
      }),
    );

    subscribe = this.subscribeResult$.pipe(
      switchMap((subscribeResult) => {
        if (subscribeResult === undefined) {
          return this.ws
            .subscribe(method as M2)
            .pipe(tap((result) => this.subscribeResult$.next(result)));
        }
        return of(subscribeResult);
      }),
    );

    callAndSubscribe = this.callAndSubscribeResult$.pipe(
      switchMap((callAndSubscribeResult) => {
        if (callAndSubscribeResult === undefined) {
          return this.ws
            .callAndSubscribe(method as M3, params as ApiCallParams<M3>)
            .pipe(tap((result) => this.callAndSubscribeResult$.next(result)));
        }
        return of(callAndSubscribeResult);
      }),
    );

    invalidate(): void {
      this.callResult$.next(undefined);
      this.subscribeResult$.next(undefined);
      this.callAndSubscribeResult$.next(undefined);
    }
  }
  return GlobalStore;
}
