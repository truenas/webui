import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  DashboardEnclosure,
} from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

describe('EnclosureStore', () => {
  let spectator: SpectatorService<EnclosureStore>;
  const createService = createServiceFactory({
    service: EnclosureStore,
    providers: [
      mockWebSocket([
        mockCall('webui.enclosure.dashboard', [] as DashboardEnclosure[]),
      ]),
      mockProvider(ThemeService),
      mockProvider(DialogService, {
        warn: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initiate();
  });

  describe('initiate with empty enclosures', () => {
    beforeEach(() => {
      spectator = createService();
      spectator.service.initiate();
    });

    it('loads dashboard information', () => {
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');

      expect(spectator.inject(DialogService).warn).toHaveBeenCalledWith(
        'Enclosure Unavailable',
        'We’re unable to access the enclosure at the moment. Please ensure it’s connected properly and try again.',
      );

      expect(spectator.service.state().enclosures).toEqual([]);
    });
  });
});
