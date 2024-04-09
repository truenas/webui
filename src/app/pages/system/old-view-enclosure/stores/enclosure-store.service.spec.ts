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
        mockCall('enclosure2.query'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.loadData();
  });

  it('calls enclosure2.query when loading data', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('enclosure2.query');
  });
});
