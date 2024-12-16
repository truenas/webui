import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { filter, map } from 'rxjs';
import { ApiService } from 'app/services/websocket/api.service';

export interface ConsoleMessagesState {
  lines: string[];
}

export const initialConsoleMessagesState: ConsoleMessagesState = {
  lines: [],
};

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class ConsoleMessagesStore extends ComponentStore<ConsoleMessagesState> implements OnDestroy {
  lines$ = this.select((state) => state.lines.join('\n'));
  lastThreeLogLines$ = this.select((state) => state.lines.slice(-3).join('\n'));

  private readonly logPath = 'filesystem.file_tail_follow:/var/log/messages:500';
  private readonly maxMessages = 500;

  private addMessage = this.updater((state, message: string) => {
    const newLines = message.split('\n').filter((line) => line.trim().length > 0);

    let lines = [...state.lines, ...newLines];
    lines = lines.slice(-this.maxMessages);

    return { ...state, lines };
  });

  constructor(
    private api: ApiService,
  ) {
    super(initialConsoleMessagesState);
  }

  subscribeToMessageUpdates(): void {
    this.api.subscribe(this.logPath)
      .pipe(
        map((event) => event.fields),
        filter((log) => typeof log?.data === 'string'),
        untilDestroyed(this),
      )
      .subscribe((log) => {
        this.addMessage(log.data);
      });
  }
}
