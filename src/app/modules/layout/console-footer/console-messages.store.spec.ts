import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ApiService } from 'app/services/websocket/api.service';

describe('ConsoleMessagesStore', () => {
  let spectator: SpectatorService<ConsoleMessagesStore>;
  const createService = createServiceFactory({
    service: ConsoleMessagesStore,
    providers: [
      mockProvider(ApiService, {
        subscribe: jest.fn(() => of({
          fields: {
            data: '[12:34] Line 1.\n[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.',
          },
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('subscribeToMessageUpdates - subscribes to log updates and calls addMessage when new message is received', async () => {
    spectator.service.subscribeToMessageUpdates();

    expect(spectator.inject(ApiService).subscribe)
      .toHaveBeenCalledWith('filesystem.file_tail_follow:/var/log/messages:500');
    const state = await firstValueFrom(spectator.service.state$);
    expect(state).toEqual({
      lines: [
        '[12:34] Line 1.',
        '[12:35] Line 2.',
        '[12:35] Line 3.',
        '[12:35] Line 4.',
      ],
    });
  });

  it('lines$ - returns lines joined with new line from state', async () => {
    spectator.service.subscribeToMessageUpdates();
    const lines = await firstValueFrom(spectator.service.lines$);
    expect(lines).toBe('[12:34] Line 1.\n[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
  });

  it('lastThreeLogLines$ - returns last three lines joined with new line from state', async () => {
    spectator.service.subscribeToMessageUpdates();
    const lines = await firstValueFrom(spectator.service.lastThreeLogLines$);
    expect(lines).toBe('[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
  });
});
