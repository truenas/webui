import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('VirtualizationInstancesStore', () => {
  let spectator: SpectatorService<VirtualizationInstancesStore>;

  const event$ = new Subject<ApiEvent<VirtualizationInstance>>();
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
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'virt.instance.query') {
            return of(instances);
          }
          return of(devices);
        }),
        subscribe: jest.fn(() => event$),
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
    });
    spectator.service.resetInstance();
    expect(spectator.service.state()).toEqual({
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
  });
});
