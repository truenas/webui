import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ExtendDialog, ExtendDialogParams,
} from 'app/pages/storage/modules/vdevs/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { PoolExtendJobService } from 'app/pages/storage/modules/vdevs/services/pool-extend-job.service';

describe('ExtendDialogComponent', () => {
  let spectator: Spectator<ExtendDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExtendDialog,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockJob('pool.attach', fakeSuccessfulJob()),
        mockCall('disk.details', {
          unused: [
            {
              devname: 'sde',
              name: 'sde',
              size: 12000138625024,
              duplicate_serial: [],
            },
            {
              devname: 'sdf',
              name: 'sdf',
              size: 10000138625024,
              duplicate_serial: [
                'sdf',
              ],
            },
          ] as DetailsDisk[],
          used: [],
        }),
        mockCall('core.get_jobs', []),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(PoolExtendJobService, {
        checkForExistingExtendJob: jest.fn(() => of(false)),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          poolId: 4,
          targetVdevGuid: 'vdev-guid',
        } as ExtendDialogParams,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('extends a vdev when new unused disk is selected', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'New Disk': 'sde (10.91 TiB)',
    });

    const extendButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
    await extendButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.attach', [
      4,
      {
        new_disk: 'sde',
        target_vdev: 'vdev-guid',
        allow_duplicate_serials: true,
      },
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows error when extend job is already running for this pool', async () => {
    const poolExtendJobService = spectator.inject(PoolExtendJobService);
    jest.spyOn(poolExtendJobService, 'checkForExistingExtendJob').mockReturnValue(of(true));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'New Disk': 'sde (10.91 TiB)',
    });

    const extendButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
    await extendButton.click();

    expect(poolExtendJobService.checkForExistingExtendJob).toHaveBeenCalledWith(4);
    expect(spectator.inject(DialogService).jobDialog).not.toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith(
      'A VDEV extension operation is already in progress for this pool. Please wait for it to complete.',
    );
  });

  it('allows operation to proceed when no existing job is found', async () => {
    const poolExtendJobService = spectator.inject(PoolExtendJobService);
    jest.spyOn(poolExtendJobService, 'checkForExistingExtendJob').mockReturnValue(of(false));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'New Disk': 'sde (10.91 TiB)',
    });

    const extendButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
    await extendButton.click();

    expect(poolExtendJobService.checkForExistingExtendJob).toHaveBeenCalledWith(4);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
