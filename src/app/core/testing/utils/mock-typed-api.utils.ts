import { ExistingProvider, FactoryProvider } from '@angular/core';
import {
  JobMethod, JobResult, QueryEntity, QueryMethod,
} from '@truenas/api-client';
import { JobUpdate } from '@truenas/api-client/testing';
import {
  MockTypedApiService, TypedCallMethod, TypedCallResponseOrFactory,
} from 'app/core/testing/classes/mock-typed-api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

type D = WebUiApiDirectory;

export type MockTypedApiResponse = (api: MockTypedApiService) => void;

/**
 * Sugar for mocking `TypedApiService`, the typed counterpart of `mockApi()`.
 *
 * Behind it is a real `@truenas/api-client` on the package's fake connection
 * (`@truenas/api-client/testing`), so the real dispatch, job correlation and
 * subscriptions run and only the answers are scripted. Fixtures are checked
 * against the API directory; a call nothing scripted fails by name.
 *
 * @example
 * providers: [
 *   mockTypedApi([
 *     mockTypedCall('system.info', { version: 'x' } as SystemInfoResult),
 *     mockTypedQuery('user.query', [{ id: 1 } as UserEntry]),
 *     mockTypedJob('pool.dataset.export_key', [{ state: JobState.Success, result: 'key' }]),
 *   ]),
 * ]
 *
 * `MockTypedApiService` is also available for adjusting answers on the fly, and
 * exposes the fake client for connection-level scenarios:
 * `spectator.inject(MockTypedApiService).client.connection.simulateClose()`.
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

export function mockTypedCall<M extends TypedCallMethod>(
  method: M,
  response: TypedCallResponseOrFactory<M>,
): MockTypedApiResponse {
  return (api) => api.mockCall(method, response);
}

export function mockTypedQuery<M extends QueryMethod<D['call']>>(
  method: M,
  rows: QueryEntity<D['call'], M>[],
): MockTypedApiResponse {
  return (api) => api.mockQuery(method, rows);
}

export function mockTypedJob<M extends JobMethod<D>>(
  method: M,
  updates: JobUpdate<JobResult<D, M>> | JobUpdate<JobResult<D, M>>[],
): MockTypedApiResponse {
  return (api) => api.mockJob(method, updates);
}
