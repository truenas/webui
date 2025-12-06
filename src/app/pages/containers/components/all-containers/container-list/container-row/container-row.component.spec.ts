import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import {
  ContainerStats,
} from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerRowComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-row.component';
import {
  StopOptionsDialog,
  StopOptionsOperation,
} from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

const container = fakeContainer({
  id: 1,
  name: 'agi_container',
  autostart: false,
  status: {
    state: ContainerStatus.Running,
    pid: 123,
    domain_state: null,
  },
});

const metrics: ContainerStats = {
  cpu: {
    cpu_user_percentage: 20,
  },
  mem_usage: {
    mem_usage_ram_mib: 512,
  },
  io_full_pressure: {
    io_full_pressure_full_60_percentage: 10,
  },
};

describe('ContainerRowComponent', () => {
  let spectator: Spectator<ContainerRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ContainerRowComponent,
    imports: [
      MapValuePipe,
    ],
    declarations: [
      MockComponent(StopOptionsDialog),
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            force: true,
            timeout: -1,
          }),
        })),
      }),
      mockProvider(ContainersStore, {
        selectedContainer: () => container,
        selectContainer: jest.fn(),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(ApiService, {
        call: jest.fn((method: string) => {
          if (method === 'container.start' || method === 'container.stop') {
            return of(undefined);
          }
          return of({});
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { container, metrics },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('cell rendering', () => {
    it('shows container name', () => {
      expect(spectator.query('.cell-name')).toHaveText('agi_container');
    });

    it('shows container status', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[2]).toHaveText('Running');
    });

    it('shows autostart value', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[3]).toHaveText('No');
    });

    it('shows metrics', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[4]).toHaveText('20%');
      expect(cells[5]).toHaveText('512 MiB');
      expect(cells[6]).toHaveText('10%');
    });

    it('shows Stop and Restart button when container is Running', async () => {
      spectator.setInput('container', fakeContainer({
        ...container,
        status: {
          state: ContainerStatus.Running,
          pid: 123,
          domain_state: null,
        },
      }));

      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(stopIcon).toExist();
      expect(restartIcon).toExist();
      expect(startIcon).not.toExist();
    });

    it('shows Start button when container is Stopped', async () => {
      spectator.setInput('container', fakeContainer({
        ...container,
        status: {
          state: ContainerStatus.Stopped,
          pid: null,
          domain_state: null,
        },
      }));

      const stopIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(restartIcon).not.toExist();
      expect(stopIcon).not.toExist();
      expect(startIcon).toExist();
    });
  });

  describe('actions', () => {
    it('shows stop options dialog and stops container when Stop icon is pressed', async () => {
      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      await stopIcon.click();

      expect(spectator.inject(MatDialog).open)
        .toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Stop });

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'container.stop',
        [1, { force: true, timeout: -1 }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container stopped');
    });

    it('shows restart options dialog and restarts container when Restart icon is pressed', async () => {
      const restartIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-restart' }));
      await restartIcon.click();

      expect(spectator.inject(MatDialog).open)
        .toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Restart });

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'container.stop',
        [1, { force: true, timeout: -1 }],
      );
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'container.start',
        [1],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container restarted');
    });

    it('starts a container when Start icon is pressed', async () => {
      spectator.setInput('container', fakeContainer({
        ...container,
        status: {
          state: ContainerStatus.Stopped,
          pid: null,
          domain_state: null,
        },
      }));

      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      await startIcon.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.start', [1]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container started');
    });
  });
});
