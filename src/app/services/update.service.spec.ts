import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { UpdateService } from 'app/services/update.service';

describe('UpdateService', () => {
  let spectator: SpectatorService<UpdateService>;
  const createService = createServiceFactory({
    service: UpdateService,
    providers: [
      mockWebSocket([
        mockCall('system.boot_id', 'boot-id-1'),
      ]),
      {
        provide: WINDOW,
        useValue: {
          location: {
            reload: jest.fn(),
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('compares boot id with last seen boot id and hard refreshes if there is a difference', () => {
    const window = spectator.inject<Window>(WINDOW);

    // Store id.
    spectator.service.hardRefreshIfNeeded().subscribe();

    // Receive same id again.
    spectator.service.hardRefreshIfNeeded().subscribe();

    expect(window.location.reload).not.toHaveBeenCalled();

    // Receive new id.
    spectator.inject(MockWebSocketService).mockCall('system.boot_id', 'boot-id-2');

    spectator.service.hardRefreshIfNeeded().subscribe();

    expect(window.location.reload).toHaveBeenCalled();
  });
});
