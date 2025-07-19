import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { clearMessages } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMessages } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

interface FormattedWebSocketDebugMessage extends WebSocketDebugMessage {
  formattedTime: string;
  methodName: string;
  messagePreview: string;
}

@Component({
  selector: 'ix-message-list',
  standalone: true,
  imports: [AsyncPipe, ScrollingModule, MatButtonModule, MatTooltipModule, IxIconComponent],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent {
  messages$: Observable<WebSocketDebugMessage[]> = this.store$.select(selectMessages);

  formattedMessages$: Observable<FormattedWebSocketDebugMessage[]> = this.messages$.pipe(
    map((messages) => messages.map((msg) => ({
      ...msg,
      formattedTime: this.formatTime(msg.timestamp),
      methodName: this.getMethodName(msg),
      messagePreview: this.getMessagePreview(msg),
    }))),
  );

  trackByMessage: TrackByFunction<FormattedWebSocketDebugMessage> = (_, message) => message.id;

  constructor(private store$: Store) {}

  clearMessages(): void {
    this.store$.dispatch(clearMessages());
  }

  copyMessage(message: WebSocketDebugMessage): void {
    const messageContent = JSON.stringify(message.message, null, 2);
    navigator.clipboard.writeText(messageContent);
  }

  private formatTime(timestamp: string): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();

    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

    return new Date(timestamp).toLocaleTimeString();
  }

  private getMethodName(message: WebSocketDebugMessage): string {
    if (message.direction === 'out' && 'method' in message.message) {
      return message.message.method;
    }
    if (message.direction === 'in' && 'msg' in message.message) {
      if (message.message.msg === 'method') {
        return 'Response';
      }
      return String(message.message.msg);
    }
    return 'Unknown';
  }

  private getMessagePreview(message: WebSocketDebugMessage): string {
    const content = message.message;
    if ('params' in content && content.params) {
      return JSON.stringify(content.params).substring(0, 100) + '...';
    }
    if ('result' in content) {
      return JSON.stringify(content.result).substring(0, 100) + '...';
    }
    return '';
  }
}
