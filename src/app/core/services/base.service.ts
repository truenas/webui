import { Injectable } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { WebSocketService } from 'app/services/ws.service';
import { CoreService } from './core.service';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected websocket: WebSocketService;
  protected core: CoreService;
  protected authenticated = false;

  constructor() {
    this.core = CoreServiceInjector.get(CoreService);
    this.websocket = CoreServiceInjector.get(WebSocketService);
    this.core.register({
      observerClass: this,
      eventName: 'Authenticated',
    }).subscribe(() => {
      this.authenticated = true;
      this.onAuthenticated();
    });
  }

  protected onAuthenticated(): void {
  }
}
