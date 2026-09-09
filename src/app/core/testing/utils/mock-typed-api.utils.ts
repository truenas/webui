import { ExistingProvider, FactoryProvider } from '@angular/core';
import {
  CallMethod, JobMethod, QueryEntity, QueryMethod,
} from '@truenas/api-client';
import { MockTypedApiService, TypedCallResponseOrFactory } from 'app/core/testing/classes/mock-typed-api.service';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

type D = WebUiApiDirectory;

export type MockTypedApiResponse = (api: MockTypedApiService) => void;

/**
 * Sugar for mocking `TypedApiService`, the typed counterpart of `mockApi()`.
 *
 * @example
 * providers: [
 *   mockTypedApi([
 *     mockTypedCall('system.info', { version: 'x' } as SystemInfoResult),
 *     mockTypedQuery('user.query', [{ id: 1 } as UserEntry]),
 *     mockTypedJob('pool.dataset.export_key', fakeSuccessfulJob()),
 *   ]),
 * ]
 *
 * `MockTypedApiService` is also available for adjusting responses on the fly:
 * `spectator.inject(MockTypedApiService).mockCall('system.info', ...)`.
 */
export function mockTypedApi(mocks: MockTypedApiResponse[] = []): (FactoryProvider | ExistingProvider)[] {
  return [
    {
      provide: TypedApiService,
      useFactory: () => {
        const api = new MockTypedApiService();
        mocks.forEach((apply) => apply(api));
        return api;
      },
    },
    {
      provide: MockTypedApiService,
      useExisting: TypedApiService,
    },
  ];
}

export function mockTypedCall<M extends CallMethod<D>>(
  method: M,
  response?: TypedCallResponseOrFactory<M>,
): MockTypedApiResponse {
  return (api) => api.mockCall(method, response);
}

export function mockTypedQuery<M extends QueryMethod<D['call']>>(
  method: M,
  rows: QueryEntity<D['call'], M>[],
): MockTypedApiResponse {
  return (api) => api.mockQuery(method, rows);
}

export function mockTypedJob<M extends JobMethod<D>>(method: M, job: Job): MockTypedApiResponse {
  return (api) => api.mockJob(method, job);
}
