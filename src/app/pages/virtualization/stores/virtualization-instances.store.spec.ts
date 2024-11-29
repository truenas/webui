import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ApiService } from 'app/services/websocket/api.service';

describe('VirtualizationInstancesStore', () => {
  let spectator: SpectatorService<VirtualizationInstancesStore>;

  const instances = [
    { id: 'instance1' },
    { id: 'instance2' },
  ] as VirtualizationInstance[];

  const devices = [
    { name: 'device1' },
    { name: 'device2' },
  ] as VirtualizationDevice[];

  const createService = createServiceFactory({
    service: VirtualizationInstancesStore,
    providers: [
      mockApi([
        mockCall('virt.instance.query', instances),
        mockCall('virt.instance.device_list', devices),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have initial state', () => {
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: true,
      instances: undefined,
    });
  });

  it('should load instances when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      isLoading: false,
    });
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('instances - returns instances part of the state', () => {
      expect(spectator.service.instances()).toEqual(instances);
    });
  });
});
