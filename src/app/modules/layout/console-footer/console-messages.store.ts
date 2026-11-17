import { computed, Injectable, inject } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  catchError, EMPTY, filter, map, pipe, switchMap, tap,
} from 'rxjs';
import { ApiService } from 'app/modules/websocket/api.service';

export interface ConsoleMessagesState {
  lines: string[];
}

const initialState: ConsoleMessagesState = {
  lines: [],
};

const maxMessages = 500;

@Injectable({
  providedIn: 'root',
})
export class ConsoleMessagesStore {
  private api = inject(ApiService);

  private readonly state = signalState(initialState);

  readonly lines = computed(() => this.state.lines().join('\n'));
  readonly lastThreeLogLines = computed(() => this.state.lines().slice(-3).join('\n'));

  /**
   * Follows /var/log/messages. Calling it again replaces the previous subscription instead of adding a second one,
   * and starts from a clean slate, because the new subscription replays the tail of the log.
   */
  readonly subscribeToMessageUpdates = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { lines: [] })),
    switchMap(() => this.api.subscribe('filesystem.file_tail_follow', {
      path: '/var/log/messages',
      tail_lines: maxMessages,
    }).pipe(
      map((event) => (event.msg === 'added' ? event.fields.data : null)),
      filter((data) => typeof data === 'string'),
      tap((data) => this.addMessage(data)),
      // The console footer is informational: a failed follow should not break later calls of this method.
      catchError(() => EMPTY),
    )),
  ));

  private addMessage(message: string): void {
    const newLines = message.split('\n').filter((line) => line.trim().length > 0);
    patchState(this.state, (state) => ({
      lines: [...state.lines, ...newLines].slice(-maxMessages),
    }));
  }
}
