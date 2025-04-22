import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Component({
  selector: 'ix-reconnect-message',
  templateUrl: './reconnect-message.component.html',
  styleUrls: ['./reconnect-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TranslateModule,
  ],
})
export class ReconnectMessage {
  constructor(
    private wsStatus: WebSocketStatusService,
    private wsHandler: WebSocketHandlerService,
  ) {}

  protected reconnectPressed(): void {
    this.wsHandler.reconnect();
    this.wsStatus.setReconnectStatus(false);
  }
}
