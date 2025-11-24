import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ContainerDeviceEntry, ContainerInstance } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/containers/stores/container-instances.store';
import { fakeContainerInstance } from 'app/pages/containers/utils/fake-container-instance.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ContainerDevicesStore', () => {
  let spectator: SpectatorService<ContainerDevicesStore>;
  let selectedInstanceSignal: ReturnType<typeof signal<ContainerInstance | undefined>>;

  const instances = [
    fakeContainerInstance({ id: 1 }),
    fakeContainerInstance({ id: 2 }),
  ];

  const containerDevices = [
    {
      id: 1, container: 1, attributes: { name: 'device1' },
    } as unknown as ContainerDeviceEntry,
    {
      id: 2, container: 1, attributes: { name: 'device2' },
    } as unknown as ContainerDeviceEntry,
  ] as ContainerDeviceEntry[];

  const createService = createServiceFactory({
    service: ContainerDevicesStore,
    providers: [
      mockApi([
        mockCall('container.device.query', containerDevices),
      ]),
      mockProvider(ContainerInstancesStore, {
        instances: jest.fn(() => instances),
        selectedInstance: jest.fn(() => selectedInstanceSignal()),
      }),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    selectedInstanceSignal = signal<ContainerInstance | undefined>(instances[0]);
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
      .toHaveBeenCalledWith('container.device.query', [[['container', '=', 1]]]);
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
    it('starts with empty devices until loadDevices is called', () => {
      // Store is created in beforeEach with instances[0] selected
      // Devices start empty until explicitly loaded
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
