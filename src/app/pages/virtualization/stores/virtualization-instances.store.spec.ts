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

  it('should have default empty state', () => {
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: false,
      instances: [],
      selectedInstance: null,
      isLoadingDevices: false,
      selectedInstanceDevices: [],
    });
  });

  it('should load instances when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.stateAsSignal()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: null,
      isLoadingDevices: false,
      selectedInstanceDevices: [],
    });
  });

  it('selectInstance - selects an instance and loads its devices', () => {
    jest.spyOn(spectator.service, 'loadDevices');

    spectator.service.initialize();
    spectator.service.selectInstance('instance1');

    expect(spectator.service.selectedInstance()).toBe(instances[0]);
    expect(spectator.service.loadDevices).toHaveBeenCalled();
  });

  it('loadDevices – loads a list of devices for the selected instance', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    spectator.service.loadDevices();

    expect(spectator.service.selectedInstanceDevices()).toBe(devices);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_list', ['instance1']);
  });

  it('deviceDeleted – removes a device from list of devices for selected instance', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    spectator.service.deviceDeleted('device1');

    expect(spectator.service.selectedInstanceDevices()).toEqual([devices[1]]);
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('instances - returns instances part of the state', () => {
      expect(spectator.service.instances()).toBe(instances);
    });

    it('selectedInstance - returns selected instance from the state', () => {
      expect(spectator.service.selectedInstance()).toBeNull();
    });

    it('isLoadingDevices - returns flag showing whether devices are being loaded', () => {
      expect(spectator.service.isLoadingDevices()).toBe(false);
    });

    it('selectedInstanceDevices - returns flag showing whether devices are being loaded', () => {
      expect(spectator.service.selectedInstanceDevices()).toEqual([]);
    });
  });
});
