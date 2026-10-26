import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import { filter, map } from 'rxjs';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

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
  private api = inject(TypedApiService);
  private destroyRef = inject(DestroyRef);

  lines$ = this.select((state) => state.lines.join('\n'));
  lastThreeLogLines$ = this.select((state) => state.lines.slice(-3).join('\n'));

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
    this.api.subscribe('filesystem.file_tail_follow', { path: '/var/log/messages', tail_lines: 500 })
      .pipe(
        map((event) => (event.msg === 'added' ? event.fields.data : null)),
        filter((data) => typeof data === 'string'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.addMessage(data);
      });
  }
}
