import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('VirtualizationDevicesStore', () => {
  let spectator: SpectatorService<VirtualizationDevicesStore>;

  const instances = [
    { id: 'instance1' },
    { id: 'instance2' },
  ] as VirtualizationInstance[];

  const devices = [
    { name: 'device1' },
    { name: 'device2' },
  ] as VirtualizationDevice[];

  const createService = createServiceFactory({
    service: VirtualizationDevicesStore,
    providers: [
      mockApi([
        mockCall('virt.instance.device_list', devices),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        instances: jest.fn(() => instances),
        selectedInstance: jest.fn(() => instances[0]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      devices: [],
    });
  });

  it('should load devices when loadDevices is called', () => {
    spectator.service.loadDevices();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
      devices,
      isLoading: false,
    });
  });

  it('loadDevices – loads a list of devices for the selected instance', () => {
    spectator.service.loadDevices();

    expect(spectator.service.devices()).toBe(devices);
    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('virt.instance.device_list', ['instance1']);
  });

  it('deviceDeleted – removes a device from list of devices for selected instance', () => {
    spectator.service.loadDevices();
    spectator.service.deviceDeleted('device1');

    expect(spectator.service.devices()).toEqual([devices[1]]);
  });

  describe('selectors', () => {
    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBeFalsy();
    });

    it('devices - returns flag showing whether devices are being loaded', () => {
      expect(spectator.service.devices()).toEqual([]);
    });
  });
});
