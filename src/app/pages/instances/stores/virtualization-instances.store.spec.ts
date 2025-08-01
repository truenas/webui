import { Router, NavigationEnd } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  VirtualizationDevice, VirtualizationInstance, VirtualizationMetrics,
} from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('VirtualizationInstancesStore', () => {
  let spectator: SpectatorService<VirtualizationInstancesStore>;

  const event$ = new Subject<ApiEvent<VirtualizationInstance>>();
  const metricsEvent$ = new Subject<ApiEvent<VirtualizationMetrics>>();
  const instances = [
    { id: 'instance1' },
    { id: 'instance2' },
  ] as VirtualizationInstance[];

  const devices = [
    { name: 'device1' },
    { name: 'device2' },
  ] as VirtualizationDevice[];

  const routerEvents$ = new Subject<NavigationEnd>();

  const createService = createServiceFactory({
    service: VirtualizationInstancesStore,
    providers: [
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'virt.instance.query') {
            return of(instances);
          }
          return of(devices);
        }),
        subscribe: jest.fn((method) => {
          if (method === 'virt.instance.metrics') {
            return metricsEvent$;
          }
          return event$;
        }),
      }),
      mockProvider(Router, {
        events: routerEvents$,
        url: '/containers/view/instance1',
        navigate: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have initial state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: true,
      selectedInstance: undefined,
      selectedInstanceId: null,
      instances: undefined,
      metrics: {},
    });
  });

  it('should load instances when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
      instances,
      selectedInstance: undefined,
      selectedInstanceId: null,
      isLoading: false,
      metrics: {},
    });
  });

  it('should select instance when method is called', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    expect(spectator.service.state()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: instances[0],
      selectedInstanceId: 'instance1',
      metrics: {},
    });
  });

  it('resets selected instance', () => {
    spectator.service.initialize();
    spectator.service.selectInstance('instance1');
    expect(spectator.service.state()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: instances[0],
      selectedInstanceId: 'instance1',
      metrics: {},
    });
    spectator.service.resetInstance();
    expect(spectator.service.state()).toEqual({
      instances,
      isLoading: false,
      selectedInstance: null,
      selectedInstanceId: 'instance1',
      metrics: {},
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

  describe('handles subscribe events', () => {
    beforeEach(() => spectator.service.initialize());
    it('adds instance to the list if add event emitted', () => {
      event$.next({
        collection: 'virt.instance.query',
        id: 'instance3',
        msg: CollectionChangeType.Added,
        fields: { id: 'instance3' } as VirtualizationInstance,
      });

      expect(spectator.service.instances()).toEqual([
        ...instances,
        { id: 'instance3' },
      ]);
    });

    it('handles change event', () => {
      event$.next({
        collection: 'virt.instance.query',
        id: 'instance2',
        msg: CollectionChangeType.Changed,
        fields: { id: 'instance2', name: 'instance3' } as VirtualizationInstance,
      });
      expect(spectator.service.instances()).toEqual([
        { id: 'instance1' },
        { id: 'instance2', name: 'instance3' },
      ]);
    });

    it('handles remove event', () => {
      event$.next({
        collection: 'virt.instance.query',
        id: 'instance2',
        msg: CollectionChangeType.Removed,
        fields: { id: 'instance2' } as VirtualizationInstance,
      });
      expect(spectator.service.instances()).toEqual([
        { id: 'instance1' },
      ]);
    });

    it('handles metrics event when on view page', () => {
      const mockInstanceMetrics = {
        test: {
          cpu: {
            cpu_user_percentage: 20,
          },
          mem_usage: {
            mem_usage_ram_mib: 512,
          },
          io_full_pressure: {
            io_full_pressure_full_60_percentage: 10,
          },
        },
      } as unknown as VirtualizationMetrics;

      metricsEvent$.next({
        collection: 'virt.instance.metrics',
        id: 'metrics',
        msg: CollectionChangeType.Changed,
        fields: mockInstanceMetrics,
      });

      expect(spectator.service.metrics()).toEqual(mockInstanceMetrics);
    });
  });
});
