import { getMissingInjectionErrorFactory } from 'app/core/testing/utils/missing-injection-factories';
import { ApiService } from 'app/modules/websocket/api.service';

/**
 * Provided globally in `setup-jest.ts` so a spec that reaches `ApiService`
 * without mocking it fails with a clear error instead of building the real
 * client, which opens a WebSocket to `environment.remote` and hangs the test.
 *
 * Mock it per spec with `mockApi()`. A bare `mockProvider(ApiService)`
 * is not enough: `query`, `queryOne` and `queryCount` are instance properties
 * rather than prototype methods, so Spectator's spy object leaves them
 * undefined. Pass them explicitly if you must use `mockProvider`:
 * `mockProvider(ApiService, { query: jest.fn(() => of([])) })`.
 */
export class EmptyApiService {
  call = getMissingInjectionErrorFactory(ApiService.name);
  callUndeclared = getMissingInjectionErrorFactory(ApiService.name);
  callUnauthenticated = getMissingInjectionErrorFactory(ApiService.name);
  query = getMissingInjectionErrorFactory(ApiService.name);
  queryOne = getMissingInjectionErrorFactory(ApiService.name);
  queryCount = getMissingInjectionErrorFactory(ApiService.name);
  job = getMissingInjectionErrorFactory(ApiService.name);
  startJob = getMissingInjectionErrorFactory(ApiService.name);
  subscribe = getMissingInjectionErrorFactory(ApiService.name);
  queryAndSubscribe = getMissingInjectionErrorFactory(ApiService.name);
}
