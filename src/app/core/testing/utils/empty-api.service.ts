import { getMissingInjectionErrorFactory } from 'app/core/testing/utils/missing-injection-factories';
import { ApiService } from 'app/modules/websocket/api.service';

/**
 * Provided globally in `setup-jest.ts` so an unmocked `ApiService` fails clearly instead of opening
 * a WebSocket and hanging. Mock it with `mockApi()`. A bare `mockProvider(ApiService)` leaves
 * `query`, `queryOne` and `queryCount` undefined, since they are instance properties, so pass them
 * explicitly: `mockProvider(ApiService, { query: jest.fn(() => of([])) })`.
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
