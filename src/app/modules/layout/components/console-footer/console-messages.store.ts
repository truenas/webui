import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import { WebSocketService } from 'app/services';

export interface ConsoleMessagesState {
  lines: string[];
}

export const initialConsoleMessagesState: ConsoleMessagesState = {
  lines: [],
};

@UntilDestroy()
@Injectable()
export class ConsoleMessagesStore extends ComponentStore<ConsoleMessagesState> implements OnDestroy {
  lines$ = this.select((state) => state.lines.join('\n'));
  lastThreeLogLines$ = this.select((state) => state.lines.slice(-3).join('\n'));

  private readonly logPath = 'filesystem.file_tail_follow:/var/log/messages:500';
  private readonly maxMessages = 500;
  private subscriptionId: string;

  private addMessage = this.updater((state, message: string) => {
    const newLines = message.split('\n')
      .filter((line) => line.trim().length > 0);

    let lines = [...state.lines, ...newLines];
    lines = lines.slice(-this.maxMessages);

    return { ...state, lines };
  });

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialConsoleMessagesState);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.subscriptionId) {
      this.ws.unsub(this.logPath, this.subscriptionId);
    }
  }

  subscribeToMessageUpdates(): void {
    this.subscriptionId = UUID.UUID();
    this.ws.sub(this.logPath, this.subscriptionId).pipe(untilDestroyed(this)).subscribe((log) => {
      if (typeof log?.data !== 'string') {
        return;
      }

      this.addMessage(log.data);
    });
  }
}
