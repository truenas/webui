import { Router, NavigationEnd } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ContainerStatus } from 'app/enums/container.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Container, ContainerMetrics } from 'app/interfaces/container.interface';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ContainerSortField, ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainersStore', () => {
  let spectator: SpectatorService<ContainersStore>;

  // The wire shape, which a status-only change does not fit the generated event type for.
  const event$ = new Subject<{ msg: CollectionChangeType; id: number | string; fields?: Partial<Container> }>();
  const metricsEvent$ = new Subject<ApiEvent<ContainerMetrics>>();
  const containers = [
    fakeContainer({ id: 1, name: 'container1' }),
    fakeContainer({ id: 2, name: 'container2' }),
  ];

  const defaultSort = { active: ContainerSortField.Name, direction: SortDirection.Asc };

  const routerEvents$ = new Subject<NavigationEnd>();

  const createService = createServiceFactory({
    service: ContainersStore,
    providers: [
      // A stub rather than `mockTypedApi()`: the store's name-keyed, status-only change events are
      // the wire shape the generated `container.query` event type does not describe, so they are
      // fed in as they arrive.
      mockProvider(TypedApiService, {
        query: jest.fn(() => of(containers)),
        subscribe: jest.fn(() => event$),
      }),
      // `container.metrics` stays on the legacy client (gap 17 in docs/devs/typed-api-client.md).
      mockProvider(ApiService, {
        subscribe: jest.fn(() => metricsEvent$),
      }),
      mockProvider(Router, {
        events: routerEvents$,
        url: '/containers/view/instance1',
        navigate: jest.fn(),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have initial state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      selectedContainer: undefined,
      selectedContainerId: null,
      containers: undefined,
      metrics: {},
      sort: defaultSort,
    });
    expect(spectator.service.hasLoaded()).toBe(false);
  });

  it('should load containers when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('container.query');
    expect(spectator.service.state()).toEqual({
      containers,
      selectedContainer: undefined,
      selectedContainerId: null,
      isLoading: false,
      metrics: {},
      sort: defaultSort,
    });
  });

  it('should not make duplicate API calls when initialize is called while loading', () => {
    spectator.service.patchState({ isLoading: true });
    spectator.service.initialize();

    expect(spectator.inject(TypedApiService).query).not.toHaveBeenCalled();
  });

  it('should make API call when reload is called after initialization', () => {
    spectator.service.initialize();
    spectator.service.reload();

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledTimes(2);
  });

  it('should make API call when reload is called even while loading', () => {
    spectator.service.patchState({ isLoading: true });
    spectator.service.reload();

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('container.query');
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
      sort: defaultSort,
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
      sort: defaultSort,
    });
    spectator.service.resetContainer();
    expect(spectator.service.state()).toEqual({
      containers,
      isLoading: false,
      selectedContainer: null,
      selectedContainerId: 1,
      metrics: {},
      sort: defaultSort,
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

    it('hasLoaded - returns true after containers are loaded', () => {
      expect(spectator.service.hasLoaded()).toBe(true);
    });
  });

  describe('container updates subscription', () => {
    it('subscribes to container updates in constructor', () => {
      expect(spectator.inject(TypedApiService).subscribe).toHaveBeenCalledWith('container.query');
    });

    it('does not create duplicate subscriptions on multiple initialize calls', () => {
      const initialSubscribeCalls = spectator.inject(TypedApiService).subscribe.mock.calls.filter(
        (call: [string]) => call[0] === 'container.query',
      ).length;

      spectator.service.initialize();
      spectator.service.initialize();

      const currentSubscribeCalls = spectator.inject(TypedApiService).subscribe.mock.calls.filter(
        (call: [string]) => call[0] === 'container.query',
      ).length;

      expect(currentSubscribeCalls).toBe(initialSubscribeCalls);
    });
  });

  describe('handles subscribe events', () => {
    beforeEach(() => spectator.service.initialize());
    it('adds container to the list if add event emitted', () => {
      const newContainer = fakeContainer({ id: 3 });
      event$.next({
        id: 3,
        msg: CollectionChangeType.Added,
        fields: newContainer,
      });

      expect(spectator.service.containers()).toEqual([
        ...containers,
        newContainer,
      ]);
    });

    it('sorts containers by name when an out-of-order container is added', () => {
      const newContainer = fakeContainer({ id: 3, name: 'aaa-container' });
      event$.next({
        id: 3,
        msg: CollectionChangeType.Added,
        fields: newContainer,
      });

      expect(spectator.service.containers()).toEqual([
        newContainer,
        ...containers,
      ]);
    });

    it('handles change event', () => {
      event$.next({
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

  describe('sorting', () => {
    const bravoRunning = fakeContainer({
      id: 1, name: 'bravo', autostart: false, status: { state: ContainerStatus.Running },
    } as Partial<Container>);
    const alphaStopped = fakeContainer({
      id: 2, name: 'alpha', autostart: true, status: { state: ContainerStatus.Stopped },
    } as Partial<Container>);

    beforeEach(() => {
      spectator.service.initialize();
      spectator.service.patchState({ containers: [bravoRunning, alphaStopped] });
    });

    it('sorts by name descending', () => {
      spectator.service.setSort({ active: ContainerSortField.Name, direction: SortDirection.Desc });

      expect(spectator.service.containers().map((container) => container.name)).toEqual(['bravo', 'alpha']);
    });

    it('sorts by autostart', () => {
      spectator.service.setSort({ active: ContainerSortField.Autostart, direction: SortDirection.Asc });

      // autostart false (bravo) sorts before true (alpha).
      expect(spectator.service.containers().map((container) => container.name)).toEqual(['bravo', 'alpha']);
    });

    it('sorts by status', () => {
      spectator.service.setSort({ active: ContainerSortField.Status, direction: SortDirection.Asc });

      // Running < Stopped alphabetically.
      expect(spectator.service.containers().map((container) => container.name)).toEqual(['bravo', 'alpha']);
    });

    it('keeps the name tie-break ascending when the primary sort is descending', () => {
      const charlieRunning = fakeContainer({
        id: 3, name: 'charlie', autostart: false, status: { state: ContainerStatus.Running },
      } as Partial<Container>);
      spectator.service.patchState({ containers: [bravoRunning, alphaStopped, charlieRunning] });
      spectator.service.setSort({ active: ContainerSortField.Status, direction: SortDirection.Desc });

      // Stopped sorts first (descending), then the two Running containers stay A→Z (bravo, charlie)
      // rather than being reversed by the primary direction.
      expect(spectator.service.containers().map((container) => container.name)).toEqual(['alpha', 'bravo', 'charlie']);
    });

    it('sorts client-side without sending order_by to the backend', () => {
      spectator.service.setSort({ active: ContainerSortField.Name, direction: SortDirection.Desc });

      expect(jest.mocked(spectator.inject(TypedApiService).query).mock.calls).toEqual([['container.query']]);
    });
  });
});
