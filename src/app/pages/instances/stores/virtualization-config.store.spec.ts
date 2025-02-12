import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';

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
      mockApi([
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
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
