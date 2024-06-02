import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DiskTemperatureService', () => {
  let spectator: SpectatorService<DiskTemperatureService>;
  const createService = createServiceFactory({
    service: DiskTemperatureService,
    providers: [
      mockWebSocket([
        mockCall('disk.temperatures'),
        mockCall('webui.enclosure.dashboard'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('fetch', () => {
    it('calls "disk.temperatures"', () => {
      spectator.service.fetch(['sda']);
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('disk.temperatures', [['sda']]);
    });
  });

  describe('listenForTemperatureUpdates', () => {
    it('calls "webui.enclosure.dashboard"', () => {
      spectator.service.listenForTemperatureUpdates();
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');
    });
  });
});
