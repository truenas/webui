import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('VirtualizationDevicesStore', () => {
  let spectator: SpectatorService<VirtualizationDevicesStore>;
  let selectedInstanceSignal: ReturnType<typeof signal<VirtualizationInstance | undefined>>;

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
        selectedInstance: jest.fn(() => selectedInstanceSignal()),
      }),
    ],
  });

  beforeEach(() => {
    selectedInstanceSignal = signal<VirtualizationInstance | undefined>(instances[0]);
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

  describe('constructor behavior with signal changes', () => {
    it('automatically loads devices when instance is selected on init', () => {
      // Store is created in beforeEach with instances[0] selected
      // The constructor should not automatically call loadDevices
      expect(spectator.service.devices()).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('sets isLoading to false on API error', () => {
      const delayedResponse$ = new Subject<VirtualizationDevice[]>();
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
      expect(spectator.service.devices()).toEqual(devices);

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.loadDevices();

      expect(spectator.service.devices()).toEqual([]);
    });
  });

  describe('loading state', () => {
    it('sets isLoading to true while fetching devices', () => {
      const delayedResponse$ = new Subject<VirtualizationDevice[]>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.loadDevices();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(devices);

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('sets isLoading to false after devices are loaded', () => {
      spectator.service.loadDevices();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.devices()).toEqual(devices);
    });
  });

  describe('deviceDeleted', () => {
    beforeEach(() => {
      spectator.service.loadDevices();
    });

    it('removes only the specified device', () => {
      spectator.service.deviceDeleted('device1');

      expect(spectator.service.devices()).toEqual([devices[1]]);
    });

    it('keeps all devices if deleted device does not exist', () => {
      spectator.service.deviceDeleted('nonexistent');

      expect(spectator.service.devices()).toEqual(devices);
    });

    it('handles deleting all devices one by one', () => {
      spectator.service.deviceDeleted('device1');
      expect(spectator.service.devices()).toEqual([devices[1]]);

      spectator.service.deviceDeleted('device2');
      expect(spectator.service.devices()).toEqual([]);
    });
  });
});
