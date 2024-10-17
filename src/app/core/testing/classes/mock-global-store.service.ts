import {
  Injectable,
  Type,
  ExistingProvider,
  FactoryProvider,
  forwardRef,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { MockGlobalStoreResponses } from 'app/core/testing/interfaces/mock-global-store-responses.interface';
import {
  ApiCallAndSubscribeMethod,
  ApiCallAndSubscribeResponse,
} from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import {
  ApiCallMethod,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventMethod, ApiEventTyped } from 'app/interfaces/api-message.interface';
import {
  GlobalStoreMembers,
} from 'app/services/global-store/global-store.service';

export function mockGlobalStore<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
>(
  stores: [
    store: Type<GlobalStoreMembers<M1, M2, M3>>,
    mockResponses?: MockGlobalStoreResponses<M1, M2, M3>,
  ][],
): (FactoryProvider | ExistingProvider)[] {
  return stores.map((store) => {
    const mockStoreService = new (mockGlobalStoreService(store[1]))();
    return [
      {
        provide: store[0],
        useFactory: () => mockStoreService,
      },
      {
        provide: mockStoreService,
        useExisting: forwardRef(() => store[0]),
      },
    ];
  }).flat();
}

function mockGlobalStoreService<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
>(
  mockResponses?: MockGlobalStoreResponses<M1, M2, M3>,
): Type<GlobalStoreMembers<M1, M2, M3>> {
  @Injectable({ providedIn: 'root' })
  class MockGlobalStore implements GlobalStoreMembers<M1, M2, M3> {
    get call(): Observable<ApiCallResponse<M1>> {
      return this.getResponse(mockResponses?.call);
    }

    get subscribe(): Observable<ApiEventTyped<M2>> {
      return this.getResponse(mockResponses?.subscribe);
    }

    get callAndSubscribe(): Observable<ApiCallAndSubscribeResponse<M3>[]> {
      return this.getResponse(mockResponses?.callAndSubscribe);
    }

    invalidate(): void { /* Not needed */ }

    private getResponse<R>(mockResponse: R): Observable<R> {
      if (mockResponse === undefined) {
        throw Error('Unmocked global store response');
      }
      return of(mockResponse);
    }
  }
  return MockGlobalStore;
}
