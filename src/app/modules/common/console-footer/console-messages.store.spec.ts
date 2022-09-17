import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { ConsoleMessagesStore } from 'app/modules/common/console-footer/console-messages.store';
import { WebSocketService } from 'app/services';

describe('ConsoleMessagesStore', () => {
  let spectator: SpectatorService<ConsoleMessagesStore>;
  const createService = createServiceFactory({
    service: ConsoleMessagesStore,
    providers: [
      mockProvider(WebSocketService, {
        sub: jest.fn(() => of({
          data: '[12:34] Line 1.\n[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.',
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('subscribeToMessageUpdates - subscribes to log updates and calls addMessage when new message is received', async () => {
    spectator.service.subscribeToMessageUpdates();

    expect(spectator.inject(WebSocketService).sub)
      .toHaveBeenCalledWith('filesystem.file_tail_follow:/var/log/messages:500', expect.any(String));
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
    expect(lines).toEqual('[12:34] Line 1.\n[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
  });

  it('lastThreeLogLines$ - returns last three lines joined with new line from state', async () => {
    spectator.service.subscribeToMessageUpdates();
    const lines = await firstValueFrom(spectator.service.lastThreeLogLines$);
    expect(lines).toEqual('[12:35] Line 2.\n[12:35] Line 3.\n[12:35] Line 4.');
  });

  it('unsubscribes from updates when component is destroyed', () => {
    spectator.service.subscribeToMessageUpdates();
    const subscriptionId = spectator.inject(WebSocketService).sub.mock.lastCall[1];

    spectator.service.ngOnDestroy();
    expect(spectator.inject(WebSocketService).unsub).toHaveBeenCalledWith(
      'filesystem.file_tail_follow:/var/log/messages:500',
      subscriptionId,
    );
  });
});
