import { ExistingProvider, FactoryProvider } from '@angular/core';
import {
  JobMethod, JobResult, QueryEntity, QueryMethod,
} from '@truenas/api-client';
import { FakeApiErrorOverrides, JobUpdate } from '@truenas/api-client/testing';
import {
  MockApiService, MockCallMethod, CallResponseOrFactory, RefusableMethod,
} from 'app/core/testing/classes/mock-api.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UndeclaredCallDirectory, UndeclaredCallMethod, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export type MockApiResponse = (api: MockApiService) => void;

/**
 * Sugar for mocking `ApiService`.
 *
 * Behind it is a real `@truenas/api-client` on the package's fake connection
 * (`@truenas/api-client/testing`), so the real dispatch, job correlation and
 * subscriptions run and only the answers are scripted. Fixtures are checked
 * against the API directory; a call nothing scripted fails by name.
 *
 * @example
 * providers: [
 *   mockApi([
 *     mockCall('system.info', { version: 'x' } as SystemInfoResult),
 *     mockCallError('user.delete', { errname: 'EINVAL', extra: [['user_delete.id', 'No such user', 22]] }),
 *     mockQuery('user.query', [{ id: 1 } as UserEntry]),
 *     mockJob('pool.dataset.export_key', [{ state: JobState.Success, result: 'key' }]),
 *   ]),
 * ]
 *
 * `MockApiService` is also available for adjusting answers on the fly, and
 * exposes the fake client for connection-level scenarios:
 * `spectator.inject(MockApiService).client.connection.simulateClose()`.
 */
export function mockApi(mocks: MockApiResponse[] = []): (FactoryProvider | ExistingProvider)[] {
  return [
    {
      provide: ApiService,
      useFactory: () => {
        const api = new MockApiService();
        mocks.forEach((apply) => apply(api));
        return api;
      },
    },
    {
      provide: MockApiService,
      useExisting: ApiService,
    },
  ];
}

export function mockCall<M extends MockCallMethod>(
  method: M,
  response: CallResponseOrFactory<M>,
): MockApiResponse {
  return (api) => api.mockCall(method, response);
}

export function mockUndeclaredCall<M extends UndeclaredCallMethod>(
  method: M,
  response: UndeclaredCallDirectory[M]['response'],
): MockApiResponse {
  return (api) => api.mockUndeclaredCall(method, response);
}

/** Answers `method` with a JSON-RPC error, thrown by `call` as an `ApiCallError`. */
export function mockCallError(
  method: RefusableMethod,
  error: FakeApiErrorOverrides = {},
): MockApiResponse {
  return (api) => api.mockCallError(method, error);
}

export function mockQuery<M extends QueryMethod<D['call']>>(
  method: M,
  rows: QueryEntity<D['call'], M>[],
): MockApiResponse {
  return (api) => api.mockQuery(method, rows);
}

export function mockJob<M extends JobMethod<D>>(
  method: M,
  updates: JobUpdate<JobResult<D, M>> | JobUpdate<JobResult<D, M>>[],
): MockApiResponse {
  return (api) => api.mockJob(method, updates);
}

/**
 * Waits for the typed double to answer. It replies on a microtask, as a socket would, so a spec
 * that asserts on the outcome of a call needs to let that reply land first. A component spec has
 * `await spectator.fixture.whenStable()` for this; a service or store spec, with no fixture to
 * wait on, awaits this instead. A macrotask runs after every microtask already queued.
 */
export function settleApi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve);
  });
}
