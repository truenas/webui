import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { WebSocketService } from 'app/services/ws.service';

describe('VirtualizationConfigStore', () => {
  let spectator: SpectatorService<VirtualizationConfigStore>;
  const config: VirtualizationGlobalConfig = {
    pool: 'poolio',
    dataset: 'poolio/.ix-virt',
    state: VirtualizationGlobalState.Initialized,
    bridge: 'br0',
    v4_network: null,
    v6_network: null,
    id: 1,
  };

  const createService = createServiceFactory({
    service: VirtualizationConfigStore,
    providers: [
      mockWebSocket([
        mockCall('virt.global.config', config),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: false,
      config: null,
    });
  });

  it('should load config when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalled();
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: false,
      config,
    });
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('config - returns config part of the state', () => {
      expect(spectator.service.config()).toEqual(config);
    });

    it('virtualizationState - returns state from config part of the state', () => {
      expect(spectator.service.virtualizationState()).toBe(VirtualizationGlobalState.Initialized);
    });
  });
});
