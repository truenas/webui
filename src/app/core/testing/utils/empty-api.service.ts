import { EMPTY } from 'rxjs';
import { getMissingInjectionErrorFactory, getMissingInjectionErrorObservable } from 'app/core/testing/utils/missing-injection-factories';
import { ApiService } from 'app/modules/websocket/api.service';

export class EmptyApiService {
  readonly clearSubscriptions$ = getMissingInjectionErrorObservable(ApiService.name);
  // Read by `TypedApiService`'s constructor, so it has to be a stream rather
  // than a thrown missing-injection error.
  readonly sessionLost = EMPTY;
  call = getMissingInjectionErrorFactory(ApiService.name);
  job = getMissingInjectionErrorFactory(ApiService.name);
  callAndSubscribe = getMissingInjectionErrorFactory(ApiService.name);
  startJob = getMissingInjectionErrorFactory(ApiService.name);
  subscribe = getMissingInjectionErrorFactory(ApiService.name);
  clearSubscriptions = getMissingInjectionErrorFactory(ApiService.name);
}
