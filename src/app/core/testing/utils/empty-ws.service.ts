import { getMissingInjectionErrorFactory, getMissingInjectionErrorObservable } from 'app/core/testing/utils/missing-injection-factories';
import { WebSocketService } from 'app/services/ws.service';

export class EmptyWebsocketService {
  readonly clearSubscriptions$ = getMissingInjectionErrorObservable(WebSocketService.name);
  call = getMissingInjectionErrorFactory(WebSocketService.name);
  job = getMissingInjectionErrorFactory(WebSocketService.name);
  callAndSubscribe = getMissingInjectionErrorFactory(WebSocketService.name);
  startJob = getMissingInjectionErrorFactory(WebSocketService.name);
  subscribe = getMissingInjectionErrorFactory(WebSocketService.name);
  subscribeToLogs = getMissingInjectionErrorFactory(WebSocketService.name);
  clearSubscriptions = getMissingInjectionErrorFactory(WebSocketService.name);
}
