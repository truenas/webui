import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { take, timer } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
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
    IxIconComponent,
    FakeProgressBarComponent,
  ],
})
export class ReconnectMessage {
  isDisabled = signal(false);

  constructor(
    private wsHandler: WebSocketHandlerService,
  ) {}

  protected reconnectPressed(): void {
    this.isDisabled.set(true);
    this.wsHandler.reconnect();

    timer(0, 10000)
      .pipe(take(1), untilDestroyed(this))
      .subscribe(() => {
        this.isDisabled.set(false);
      });
  }
}
