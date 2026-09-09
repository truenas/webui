import { getMissingInjectionErrorFactory, getMissingInjectionErrorObservable } from 'app/core/testing/utils/missing-injection-factories';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

/**
 * Provided globally in `setup-jest.ts` so a spec that reaches `TypedApiService`
 * without mocking it fails with a clear error instead of building the real
 * client, which opens a WebSocket to `environment.remote` and hangs the test.
 *
 * Mock it per spec with `mockTypedApi()` or `mockProvider(TypedApiService)`.
 */
export class EmptyTypedApiService {
  readonly isAuthenticated$ = getMissingInjectionErrorObservable(TypedApiService.name);
  call = getMissingInjectionErrorFactory(TypedApiService.name);
  query = getMissingInjectionErrorFactory(TypedApiService.name);
  queryOne = getMissingInjectionErrorFactory(TypedApiService.name);
  queryCount = getMissingInjectionErrorFactory(TypedApiService.name);
  job = getMissingInjectionErrorFactory(TypedApiService.name);
  startJob = getMissingInjectionErrorFactory(TypedApiService.name);
  subscribe = getMissingInjectionErrorFactory(TypedApiService.name);
}
