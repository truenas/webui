import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceRowComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-row.component';
import {
  StopOptionsDialogComponent,
  StopOptionsOperation,
} from 'app/pages/instances/components/all-instances/instance-list/stop-options-dialog/stop-options-dialog.component';

const instance = {
  id: 'my-instance',
  name: 'agi_instance',
  status: VirtualizationStatus.Running,
  type: VirtualizationType.Container,
} as VirtualizationInstance;

describe('InstanceRowComponent', () => {
  let spectator: Spectator<InstanceRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceRowComponent,
    imports: [
      MapValuePipe,
    ],
    declarations: [
      MockComponent(StopOptionsDialogComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockJob('virt.instance.restart', fakeSuccessfulJob()),
        mockJob('virt.instance.start', fakeSuccessfulJob()),
        mockJob('virt.instance.stop', fakeSuccessfulJob()),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            force: true,
            timeout: -1,
          }),
        })),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { instance },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('cell rendering', () => {
    it('shows instance name', () => {
      expect(spectator.query('.cell-name')).toHaveText('agi_instance');
    });

    it('shows instance status', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[2]).toHaveText('Running');
    });

    it('shows instance type', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[3]).toHaveText('Container');
    });

    it('shows Stop and Restart button when instance is Running', async () => {
      spectator.setInput('instance', {
        ...instance,
        status: VirtualizationStatus.Running,
      });

      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(stopIcon).toExist();
      expect(restartIcon).toExist();
      expect(startIcon).not.toExist();
    });

    it('shows Start button when instance is Stopped', async () => {
      spectator.setInput('instance', {
        ...instance,
        status: VirtualizationStatus.Stopped,
      });

      const stopIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(restartIcon).not.toExist();
      expect(stopIcon).not.toExist();
      expect(startIcon).toExist();
    });
  });

  describe('actions', () => {
    it('shows stop options dialog and stops instance when Stop icon is pressed', async () => {
      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      await stopIcon.click();

      expect(spectator.inject(MatDialog).open)
        .toHaveBeenCalledWith(StopOptionsDialogComponent, { data: StopOptionsOperation.Stop });

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'virt.instance.stop',
        ['my-instance', { force: true, timeout: -1 }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Instance stopped');
    });

    it('shows restart options dialog and restarts instance when Restart icon is pressed', async () => {
      const restartIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-restart' }));
      await restartIcon.click();

      expect(spectator.inject(MatDialog).open)
        .toHaveBeenCalledWith(StopOptionsDialogComponent, { data: StopOptionsOperation.Restart });

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'virt.instance.restart',
        ['my-instance', { force: true, timeout: -1 }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Instance restarted');
    });

    it('starts an instance when Start icon is pressed', async () => {
      spectator.setInput('instance', {
        ...instance,
        status: VirtualizationStatus.Stopped,
      });

      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      await startIcon.click();

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.start', ['my-instance']);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Instance started');
    });
  });
});
