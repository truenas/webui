import {
  Injectable,
  Type,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import {
  ApiCallMethod,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventMethod, ApiEventTyped } from 'app/interfaces/api-message.interface';
import {
  GlobalStoreMembers,
} from 'app/services/global-store/global-store.service';
import * as globalStore from 'app/services/global-store/global-store.service';

export function mockGlobalStore<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
>(list: {
  [method in M1 | M2 | M3]?: {
    call?: ApiCallResponse<M1>;
    subscribe?: ApiEventTyped<M2>;
    callAndSubscribe?: ApiCallAndSubscribeResponse<M3>[];
  };
}): void {
  jest.spyOn(globalStore, 'globalStore').mockImplementation(
    (method: M1 | M2 | M3) => mockGlobalStoreItem(method, list[method]),
  );
}

function mockGlobalStoreItem<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
>(
  method: M1 | M2 | M3,
  options: {
    call?: ApiCallResponse<M1>;
    subscribe?: ApiEventTyped<M2>;
    callAndSubscribe?: ApiCallAndSubscribeResponse<M3>[];
  },
): Type<GlobalStoreMembers<M1, M2, M3>> {
  @Injectable({ providedIn: 'root' })
  class MockGlobalStore implements GlobalStoreMembers<M1, M2, M3> {
    get call(): Observable<ApiCallResponse<M1>> {
      return this.getResponse(options?.call);
    }

    get subscribe(): Observable<ApiEventTyped<M2>> {
      return this.getResponse(options.subscribe);
    }

    get callAndSubscribe(): Observable<ApiCallAndSubscribeResponse<M3>[]> {
      return this.getResponse(options.callAndSubscribe);
    }

    invalidate(): void {}

    private getResponse<R>(response: R): Observable<R> {
      if (response === undefined) {
        throw Error(`Unmocked "${method}" global store method`);
      }
      return of(response);
    }
  }
  return MockGlobalStore;
}
