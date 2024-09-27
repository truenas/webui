import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { isWebSocketError } from 'app/helpers/websocket.helper';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';

@Component({
  selector: 'ix-with-loading-state-error',
  templateUrl: './with-loading-state-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class WithLoadingStateErrorComponent {
  @Input() error: Error | WebSocketError;

  get errorMessage(): string {
    const error = this.error;
    if (isWebSocketError(error)) {
      return error?.reason || error.error.toString();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
