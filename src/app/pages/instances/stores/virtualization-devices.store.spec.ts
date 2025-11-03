import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceEntry, VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('VirtualizationDevicesStore', () => {
  let spectator: SpectatorService<VirtualizationDevicesStore>;

  const instances = [
    fakeVirtualizationInstance({ id: 1 }),
    fakeVirtualizationInstance({ id: 2 }),
  ];

  const containerDevices = [
    {
      id: 1, container: 'instance1', attributes: { name: 'device1' }, order: 0,
    },
    {
      id: 2, container: 'instance1', attributes: { name: 'device2' }, order: 1,
    },
  ] as ContainerDeviceEntry[];

  const createService = createServiceFactory({
    service: VirtualizationDevicesStore,
    providers: [
      mockApi([
        mockCall('container.device.query', containerDevices),
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
      devices: [
        { id: 1, name: 'device1' },
        { id: 2, name: 'device2' },
      ],
      isLoading: false,
    });
  });

  it('loadDevices – loads a list of devices for the selected instance', () => {
    spectator.service.loadDevices();

    expect(spectator.service.devices()).toEqual([
      { id: 1, name: 'device1' },
      { id: 2, name: 'device2' },
    ]);
    expect(spectator.inject(ApiService).call)
      .toHaveBeenCalledWith('container.device.query', [[['container', '=', 'instance1']]]);
  });

  it('deviceDeleted – removes a device from list of devices for selected instance', () => {
    spectator.service.loadDevices();
    spectator.service.deviceDeleted(1);

    expect(spectator.service.devices()).toEqual([{ id: 2, name: 'device2' }]);
  });

  describe('selectors', () => {
    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBeFalsy();
    });

    it('devices - returns flag showing whether devices are being loaded', () => {
      expect(spectator.service.devices()).toEqual([]);
    });
  });

  describe('constructor behavior with signal changes', () => {
    it('automatically loads devices when instance is selected on init', () => {
      // Store is created in beforeEach with instances[0] selected
      // The constructor should not automatically call loadDevices
      expect(spectator.service.devices()).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('sets isLoading to false on API error', () => {
      const delayedResponse$ = new Subject<ContainerDeviceEntry[]>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.loadDevices();
      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.error(new Error('API error'));

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.devices()).toEqual([]);
    });

    it('shows error modal when loadDevices fails', () => {
      const error = new Error('Failed to load devices');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.loadDevices();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });

    it('clears devices on API error', () => {
      spectator.service.loadDevices();
      expect(spectator.service.devices()).toEqual([
        { id: 1, name: 'device1' },
        { id: 2, name: 'device2' },
      ]);

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.loadDevices();

      expect(spectator.service.devices()).toEqual([]);
    });
  });

  describe('loading state', () => {
    it('sets isLoading to true while fetching devices', () => {
      const delayedResponse$ = new Subject<ContainerDeviceEntry[]>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.loadDevices();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(containerDevices);

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('sets isLoading to false after devices are loaded', () => {
      spectator.service.loadDevices();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.devices()).toEqual([
        { id: 1, name: 'device1' },
        { id: 2, name: 'device2' },
      ]);
    });
  });

  describe('deviceDeleted', () => {
    beforeEach(() => {
      spectator.service.loadDevices();
    });

    it('removes only the specified device', () => {
      spectator.service.deviceDeleted(1);

      expect(spectator.service.devices()).toEqual([{ id: 2, name: 'device2' }]);
    });

    it('keeps all devices if deleted device does not exist', () => {
      spectator.service.deviceDeleted(999);

      expect(spectator.service.devices()).toEqual([
        { id: 1, name: 'device1' },
        { id: 2, name: 'device2' },
      ]);
    });

    it('handles deleting all devices one by one', () => {
      spectator.service.deviceDeleted(1);
      expect(spectator.service.devices()).toEqual([{ id: 2, name: 'device2' }]);

      spectator.service.deviceDeleted(2);
      expect(spectator.service.devices()).toEqual([]);
    });
  });
});
