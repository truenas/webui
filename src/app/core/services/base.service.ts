import { Injectable } from '@angular/core';
import { WebSocketService } from 'app/services/ws.service';
import { CoreService } from './core-service/core.service';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected authenticated = false;

  constructor(protected core: CoreService, protected websocket: WebSocketService) {
    core.register({
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
