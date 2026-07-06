import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnIconButtonHarness, TnDialog, TnTableHarness, TnSortEvent,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container, ContainerStats } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { LayoutService } from 'app/modules/layout/layout.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerListComponent } from 'app/pages/containers/components/all-containers/container-list/container-list.component';
import {
  StopOptionsDialog, StopOptionsOperation,
} from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ContainerSortField, ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ContainerListComponent', () => {
  let spectator: Spectator<ContainerListComponent>;
  let loader: HarnessLoader;

  const runningContainer = fakeContainer({
    id: 1,
    name: 'agi_container',
    autostart: false,
    status: { state: ContainerStatus.Running, pid: 123, domain_state: null },
  });

  const stoppedContainer = fakeContainer({
    ...runningContainer,
    status: { state: ContainerStatus.Stopped, pid: null, domain_state: null },
  });

  const containersSignal = signal<Container[]>([runningContainer]);

  const metrics: Record<number, ContainerStats> = {
    1: {
      cpu: { cpu_user_percentage: 20 },
      mem_usage: { mem_usage_ram_mib: 512 },
      io_full_pressure: { io_full_pressure_full_60_percentage: 10 },
    } as ContainerStats,
  };

  const createComponent = createRoutingFactory({
    component: ContainerListComponent,
    declarations: [MockComponent(StopOptionsDialog)],
    providers: [
      mockAuth(),
      mockProvider(ContainersStore, {
        containers: containersSignal,
        metrics: jest.fn(() => metrics),
        isLoading: jest.fn(() => false),
        selectedContainer: jest.fn(() => runningContainer),
        selectContainer: jest.fn(),
        reload: jest.fn(),
        sort: jest.fn(() => ({ active: ContainerSortField.Name, direction: SortDirection.Asc })),
        setSort: jest.fn(),
      }),
      mockProvider(Router, { events: of() }),
      mockProvider(LayoutService, {
        navigatePreservingScroll: jest.fn(() => of()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of({ force: true, timeout: -1 }),
        })),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({ afterClosed: () => of({}) })),
      }),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(ApiService, {
        call: jest.fn(() => of(undefined)),
        job: jest.fn(() => of(undefined)),
      }),
    ],
    params: { id: 'invalid' },
  });

  beforeEach(() => {
    containersSignal.set([runningContainer]);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a row per container', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(1);
  });

  it('renders container name, autostart and metrics', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getCellText(0, 'name')).toBe('agi_container');
    expect(await table.getCellText(0, 'autostart')).toBe('No');
    expect(await table.getCellText(0, 'cpu')).toBe('20%');
    expect(await table.getCellText(0, 'ram')).toBe('512 MiB');
    expect(await table.getCellText(0, 'io')).toBe('10%');
  });

  it('navigates to details when a row is clicked', async () => {
    const router = spectator.inject(Router);
    const table = await loader.getHarness(TnTableHarness);
    await table.clickRow(0);

    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/containers', 'view', 1,
    ]);
  });

  it('opens the stop options dialog and stops a running container', async () => {
    const stopButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'stop-circle' }));
    await stopButton.click();

    expect(spectator.inject(TnDialog).open)
      .toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Stop });
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'container.stop',
      [1, { force: true, timeout: -1 }],
    );
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container stopped');
  });

  it('restarts a running container', async () => {
    const restartButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'restart' }));
    await restartButton.click();

    expect(spectator.inject(TnDialog).open)
      .toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Restart });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.start', [1]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container restarted');
  });

  it('starts a stopped container', async () => {
    containersSignal.set([stoppedContainer]);
    spectator.detectChanges();

    const startButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'play-circle' }));
    await startButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.start', [1]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container started');
  });

  it('feeds the selection into bulk actions', async () => {
    const table = await loader.getHarness(TnTableHarness);
    await table.toggleRowSelection(0);

    expect(spectator.component.hasCheckedContainers).toBe(true);
  });

  it('keeps the row selection when the list re-emits the same items (e.g. a metrics tick)', async () => {
    const table = await loader.getHarness(TnTableHarness);
    await table.toggleRowSelection(0);
    expect(await table.isRowSelected(0)).toBe(true);

    // The store re-emits a new array holding the same container objects on every
    // metrics patch; the dataSource reference must stay stable so tn-table does
    // not clear the selection.
    containersSignal.set([runningContainer]);
    spectator.detectChanges();

    expect(await table.isRowSelected(0)).toBe(true);
    expect(spectator.component.hasCheckedContainers).toBe(true);
  });

  it('marks Name, Status and Autostart columns as sortable', async () => {
    const table = await loader.getHarness(TnTableHarness);

    expect(await table.isSortable('name')).toBe(true);
    expect(await table.isSortable('status')).toBe(true);
    expect(await table.isSortable('autostart')).toBe(true);
    expect(await table.isSortable('cpu')).toBe(false);
  });

  it('updates the store sort when a sortable column header is clicked', async () => {
    const table = await loader.getHarness(TnTableHarness);
    await table.clickSortHeader('status');

    expect(spectator.inject(ContainersStore).setSort).toHaveBeenCalledWith({
      active: ContainerSortField.Status,
      direction: SortDirection.Asc,
    });
  });

  it('keeps the clicked column ascending when tn-table cycles to the unsorted state', () => {
    const component = spectator.component as unknown as { onSortChange: (event: TnSortEvent) => void };
    component.onSortChange({ column: ContainerSortField.Status, direction: '' });

    expect(spectator.inject(ContainersStore).setSort).toHaveBeenCalledWith({
      active: ContainerSortField.Status,
      direction: SortDirection.Asc,
    });
  });
});
