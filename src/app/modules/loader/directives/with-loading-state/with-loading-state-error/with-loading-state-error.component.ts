import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';

// TODO: Parse error and show something better than just "Error"
@Component({
  templateUrl: './with-loading-state-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithLoadingStateErrorComponent {
  @Input() error: Error | WebSocketError;
}
