import { inject, Injectable, Type } from '@angular/core';
import { Observable } from 'rxjs';
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

    call = this.ws.call(method as M1, params as ApiCallParams<M1>);
    subscribe = this.ws.subscribe(method as M2);
    callAndSubscribe = this.ws.callAndSubscribe(method as M3, params as ApiCallParams<M3>);
  }
  return GlobalStore;
}
