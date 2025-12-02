import { Router, NavigationEnd } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  Container, ContainerDevice, ContainerMetrics,
} from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainersStore', () => {
  let spectator: SpectatorService<ContainersStore>;

  const event$ = new Subject<ApiEvent>();
  const metricsEvent$ = new Subject<ApiEvent<ContainerMetrics>>();
  const containers = [
    fakeContainer({ id: 1, name: 'container1' }),
    fakeContainer({ id: 2, name: 'container2' }),
  ];

  const devices = [
    { id: 1, dtype: 'FILESYSTEM' },
    { id: 2, dtype: 'USB' },
  ] as ContainerDevice[];

  const routerEvents$ = new Subject<NavigationEnd>();

  const createService = createServiceFactory({
    service: ContainersStore,
    providers: [
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'container.query') {
            return of(containers);
          }
          return of(devices);
        }),
        subscribe: jest.fn((method) => {
          if (method === 'container.metrics') {
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
      selectedContainer: undefined,
      selectedContainerId: null,
      containers: undefined,
      metrics: {},
    });
  });

  it('should load containers when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
      containers,
      selectedContainer: undefined,
      selectedContainerId: null,
      isLoading: false,
      metrics: {},
    });
  });

  it('should select container when method is called', () => {
    spectator.service.initialize();
    spectator.service.selectContainer(1);
    expect(spectator.service.state()).toEqual({
      containers,
      isLoading: false,
      selectedContainer: containers[0],
      selectedContainerId: 1,
      metrics: {},
    });
  });

  it('resets selected container', () => {
    spectator.service.initialize();
    spectator.service.selectContainer(1);
    expect(spectator.service.state()).toEqual({
      containers,
      isLoading: false,
      selectedContainer: containers[0],
      selectedContainerId: 1,
      metrics: {},
    });
    spectator.service.resetContainer();
    expect(spectator.service.state()).toEqual({
      containers,
      isLoading: false,
      selectedContainer: null,
      selectedContainerId: 1,
      metrics: {},
    });
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('containers - returns containers part of the state', () => {
      expect(spectator.service.containers()).toEqual(containers);
    });
  });

  describe('handles subscribe events', () => {
    beforeEach(() => spectator.service.initialize());
    it('adds container to the list if add event emitted', () => {
      const newContainer = fakeContainer({ id: 3 });
      event$.next({
        collection: 'container.query',
        id: 3,
        msg: CollectionChangeType.Added,
        fields: newContainer,
      });

      expect(spectator.service.containers()).toEqual([
        ...containers,
        newContainer,
      ]);
    });

    it('handles change event', () => {
      event$.next({
        collection: 'container.query',
        id: 2,
        msg: CollectionChangeType.Changed,
        fields: fakeContainer({ id: 2, name: 'container3' }),
      });
      expect(spectator.service.containers()).toEqual([
        containers[0],
        expect.objectContaining({ id: 2, name: 'container3' }),
      ]);
    });

    it('handles status-only update using name-based workaround', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      event$.next({
        collection: 'container.query',
        id: containers[0].name, // API sends name instead of ID for status updates
        msg: CollectionChangeType.Changed,
        fields: { status: 'running' } as unknown as Partial<Container>,
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ContainersStore] Using name-based workaround for status update',
        { containerId: containers[0].name },
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(spectator.service.containers()[0].status).toBe('running');

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('logs error when duplicate container names detected during status update', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Set up containers with duplicate names
      const duplicateNameContainers = [
        fakeContainer({ id: 1, name: 'duplicate' }),
        fakeContainer({ id: 2, name: 'duplicate' }),
      ];
      spectator.service.patchState({ containers: duplicateNameContainers });

      event$.next({
        collection: 'container.query',
        id: 'duplicate',
        msg: CollectionChangeType.Changed,
        fields: { status: 'running' } as unknown as Partial<Container>,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ContainersStore] Duplicate container names detected - name-based status update may be unreliable',
      );
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles remove event', () => {
      event$.next({
        collection: 'container.query',
        id: 2,
        msg: CollectionChangeType.Removed,
        fields: fakeContainer({ id: 2 }),
      });
      expect(spectator.service.containers()).toEqual([
        containers[0],
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
      } as unknown as ContainerMetrics;

      metricsEvent$.next({
        collection: 'container.metrics',
        id: 'metrics',
        msg: CollectionChangeType.Changed,
        fields: mockInstanceMetrics,
      });

      expect(spectator.service.metrics()).toEqual(mockInstanceMetrics);
    });
  });
});
