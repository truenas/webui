import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

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
      selectedInstance: undefined,
      selectedInstanceId: null,
      instances: undefined,
    });
  });

  it('should load instances when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      selectedInstance: undefined,
      selectedInstanceId: null,
      isLoading: false,
    });
  });

  it('should select instance when method is called', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: instances[0],
      selectedInstanceId: 'instance1',
    });
  });

  it('resets selected instance', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: instances[0],
      selectedInstanceId: 'instance1',
    });
    spectator.service.resetInstance();
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: null,
      selectedInstanceId: 'instance1',
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
