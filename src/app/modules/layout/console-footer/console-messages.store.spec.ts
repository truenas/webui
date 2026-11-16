import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ApiService } from 'app/modules/websocket/api.service';

describe('ConsoleMessagesStore', () => {
  let spectator: SpectatorService<ConsoleMessagesStore>;
  let events$: Subject<unknown>;

  const createService = createServiceFactory({
    service: ConsoleMessagesStore,
    providers: [
      mockProvider(ApiService),
    ],
  });

  function emitLog(data: string): void {
    events$.next({ msg: 'added', fields: { data } });
  }

  beforeEach(() => {
    spectator = createService();
    jest.spyOn(spectator.inject(ApiService), 'subscribe').mockImplementation(() => {
      events$ = new Subject();
      return events$ as unknown as ReturnType<ApiService['subscribe']>;
    });
  });

  it('subscribes to /var/log/messages and exposes received lines', () => {
    spectator.service.subscribeToMessageUpdates();
    emitLog('[12:34] Line 1.\n[12:35] Line 2.\n\n[12:35] Line 3.\n[12:35] Line 4.');

    expect(spectator.inject(ApiService).subscribe)
      .toHaveBeenCalledWith('filesystem.file_tail_follow', { path: '/var/log/messages', tail_lines: 500 });
    expect(spectator.service.lines()).toBe('[12:34] Line 1.\n[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
    expect(spectator.service.lastThreeLogLines()).toBe('[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
  });

  it('appends new messages and ignores events that are not additions', () => {
    spectator.service.subscribeToMessageUpdates();
    emitLog('[12:34] Line 1.');
    events$.next({ msg: 'changed', fields: { data: 'ignored' } });
    emitLog('[12:35] Line 2.');

    expect(spectator.service.lines()).toBe('[12:34] Line 1.\n[12:35] Line 2.');
  });

  it('keeps only the last 500 lines', () => {
    spectator.service.subscribeToMessageUpdates();
    emitLog(Array.from({ length: 510 }, (_, i) => `Line ${i}`).join('\n'));

    const lines = spectator.service.lines().split('\n');
    expect(lines).toHaveLength(500);
    expect(lines[0]).toBe('Line 10');
    expect(lines[499]).toBe('Line 509');
  });

  it('replaces the previous subscription and its lines when called again', () => {
    spectator.service.subscribeToMessageUpdates();
    const firstEvents$ = events$;
    emitLog('[12:34] Old line.');

    spectator.service.subscribeToMessageUpdates();
    emitLog('[12:35] New line.');

    expect(firstEvents$.observed).toBe(false);
    expect(spectator.service.lines()).toBe('[12:35] New line.');
  });

  it('can subscribe again after the subscription errors', () => {
    spectator.service.subscribeToMessageUpdates();
    events$.error(new Error('Failed'));

    spectator.service.subscribeToMessageUpdates();
    emitLog('[12:35] Line after error.');

    expect(spectator.service.lines()).toBe('[12:35] Line after error.');
  });
});
