import { getMissingInjectionErrorFactory, getMissingInjectionErrorObservable } from 'app/core/testing/utils/missing-injection-factories';
import { ApiService } from 'app/services/websocket/api.service';

export class EmptyApiService {
  readonly clearSubscriptions$ = getMissingInjectionErrorObservable(ApiService.name);
  call = getMissingInjectionErrorFactory(ApiService.name);
  job = getMissingInjectionErrorFactory(ApiService.name);
  callAndSubscribe = getMissingInjectionErrorFactory(ApiService.name);
  startJob = getMissingInjectionErrorFactory(ApiService.name);
  subscribe = getMissingInjectionErrorFactory(ApiService.name);
  clearSubscriptions = getMissingInjectionErrorFactory(ApiService.name);
}
