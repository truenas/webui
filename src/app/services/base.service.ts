import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CoreService } from 'app/services/core-service/core.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected authenticated = false;

  constructor(
    protected core: CoreService,
    protected websocket: WebSocketService,
  ) {
    this.websocket.authStatus.pipe(untilDestroyed(this)).subscribe((evt) => {
      this.core.emit({ name: 'Authenticated', data: evt, sender: this });
    });

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
