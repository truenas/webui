import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';

describe('VirtualizationConfigStore', () => {
  let spectator: SpectatorService<VirtualizationConfigStore>;
  const config: ContainerGlobalConfig = {
    bridge: 'br0',
    v4_network: null,
    v6_network: null,
  } as ContainerGlobalConfig;

  const createService = createServiceFactory({
    service: VirtualizationConfigStore,
    providers: [
      mockApi([
        mockCall('lxc.config', config),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config: null,
    });
  });

  it('should load config when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
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
  });
});
