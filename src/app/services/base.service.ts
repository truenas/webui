import { Injectable } from '@angular/core';
import { CoreService } from 'app/services/core-service/core.service';
import { WebSocketService } from 'app/services/ws.service';

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
