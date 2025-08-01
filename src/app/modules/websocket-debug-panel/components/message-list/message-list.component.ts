import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { scrollToBottomDelayMs } from 'app/modules/websocket-debug-panel/constants';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { clearMessages, toggleMessageExpansion } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMessages } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

interface FormattedWebSocketDebugMessage extends WebSocketDebugMessage {
  formattedTime: string;
  methodName: string;
  messagePreview: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-message-list',
  standalone: true,
  imports: [
    JsonPipe,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    IxIconComponent,
  ],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements AfterViewInit {
  private store$ = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('messageViewport', { read: ElementRef }) protected messageViewport?: ElementRef<HTMLDivElement>;
  messages$: Observable<WebSocketDebugMessage[]> = this.store$.select(selectMessages);
  autoScroll = true;
  protected hasMessages = false;
  protected formattedMessagesArray: FormattedWebSocketDebugMessage[] = [];

  formattedMessages$: Observable<FormattedWebSocketDebugMessage[]> = this.messages$.pipe(
    map((messages) => messages.map((msg) => ({
      ...msg,
      formattedTime: this.formatTime(msg.timestamp),
      methodName: this.getMethodName(msg),
      messagePreview: this.getMessagePreview(msg),
    }))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ngAfterViewInit(): void {
    // Subscribe to messages for both empty state check and auto-scroll
    this.formattedMessages$.pipe(
      untilDestroyed(this),
    ).subscribe((messages) => {
      this.hasMessages = messages.length > 0;
      this.formattedMessagesArray = messages;
      this.cdr.markForCheck();
      // Auto-scroll logic
      if (this.autoScroll && messages.length > 0 && this.messageViewport) {
        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
          const element = this.messageViewport?.nativeElement;
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, scrollToBottomDelayMs);
      }
    });
  }

  protected clearMessages(): void {
    this.store$.dispatch(clearMessages());
  }

  protected copyMessage(message: WebSocketDebugMessage): void {
    const messageContent = JSON.stringify(message.message, null, 2);
    navigator.clipboard.writeText(messageContent);
  }

  protected toggleMessage(messageId: string): void {
    // Create a new action to toggle message expansion
    this.store$.dispatch(toggleMessageExpansion({ messageId }));
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
    // First check if we have a cached method name
    if (message.methodName) {
      return message.methodName;
    }

    // Fallback to extracting from message content
    if (message.direction === 'out' && 'method' in message.message) {
      return message.message.method;
    }
    if (message.direction === 'in' && 'method' in message.message && message.message.method) {
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
    let data: unknown;

    if ('params' in content && content.params) {
      data = content.params;
    } else if ('result' in content) {
      data = content.result;
    } else {
      data = content;
    }

    // Create a compact single-line preview
    const preview = JSON.stringify(data);
    const maxLength = 150;

    if (preview.length > maxLength) {
      return preview.substring(0, maxLength) + '...';
    }
    return preview;
  }
}
