import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
import { WebSocketService } from 'app/services/ws.service';

describe('EnclosureStore', () => {
  let spectator: SpectatorService<EnclosureStore>;

  const createService = createServiceFactory({
    service: EnclosureStore,
    providers: [
      mockWebSocket([
        mockCall('webui.enclosure.dashboard'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.loadData();
  });

  it('calls webui.enclosure.dashboard when loading data', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');
  });

  describe('getPools', () => {
    it('returns pool names', () => {
      const enclosure = {
        elements: {
          'Array Device Slot': {
            1: {
              pool_info: null,
            } as DashboardEnclosureSlot,
            2: {
              pool_info: { pool_name: 'pool_2' },
            } as DashboardEnclosureSlot,
            3: {
              pool_info: { pool_name: 'pool_3' },
            } as DashboardEnclosureSlot,
          } as Record<number, DashboardEnclosureSlot>,
        },
      } as OldEnclosure;
      expect(spectator.service.getPools(enclosure)).toEqual(['pool_2', 'pool_3']);
    });
  });
});
