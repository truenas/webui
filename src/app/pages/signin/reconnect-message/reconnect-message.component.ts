import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SigninStore } from 'app/pages/signin/store/signin.store';

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
    private signinStore: SigninStore,
  ) {}

  protected onReconnectClick(): void {
    this.signinStore.init();
  }
}
