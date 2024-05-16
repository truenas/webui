import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
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
});
