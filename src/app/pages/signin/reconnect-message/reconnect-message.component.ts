import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@UntilDestroy()
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
    private wsHandler: WebSocketHandlerService,
  ) {}

  protected onReconnectClick(): void {
    this.wsHandler.reconnect();
  }
}
