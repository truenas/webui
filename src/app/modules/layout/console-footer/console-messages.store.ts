import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import { filter, map } from 'rxjs';
import { ApiService } from 'app/modules/websocket/api.service';

export interface ConsoleMessagesState {
  lines: string[];
}

export const initialConsoleMessagesState: ConsoleMessagesState = {
  lines: [],
};

@Injectable({
  providedIn: 'root',
})
export class ConsoleMessagesStore extends ComponentStore<ConsoleMessagesState> implements OnDestroy {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  lines$ = this.select((state) => state.lines.join('\n'));
  lastThreeLogLines$ = this.select((state) => state.lines.slice(-3).join('\n'));

  private readonly logPath = `filesystem.file_tail_follow:${JSON.stringify({ path: '/var/log/messages', tail_lines: 500 })}` as const;
  private readonly maxMessages = 500;

  private addMessage = this.updater((state, message: string) => {
    const newLines = message.split('\n').filter((line) => line.trim().length > 0);

    let lines = [...state.lines, ...newLines];
    lines = lines.slice(-this.maxMessages);

    return { ...state, lines };
  });

  constructor() {
    super(initialConsoleMessagesState);
  }

  subscribeToMessageUpdates(): void {
    this.api.subscribe<'filesystem.file_tail_follow'>(this.logPath)
      .pipe(
        map((event) => event.fields),
        filter((log) => typeof log?.data === 'string'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((log) => {
        this.addMessage(log.data);
      });
  }
}
