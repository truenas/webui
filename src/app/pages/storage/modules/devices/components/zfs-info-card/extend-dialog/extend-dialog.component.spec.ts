import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ExtendDialogComponent, ExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ExtendDialogComponent', () => {
  let spectator: Spectator<ExtendDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExtendDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('pool.attach', fakeSuccessfulJob()),
        mockCall('disk.get_unused', [
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
        ] as UnusedDisk[]),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
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

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('pool.attach', [
      4,
      {
        new_disk: 'sde',
        target_vdev: 'vdev-guid',
      },
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('sends submit request with allow_duplicate_serials = true when selected disk is listed as having duplicate serial', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'New Disk': 'sdf (9.1 TiB)',
    });

    const extendButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
    await extendButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('pool.attach', [
      4,
      {
        new_disk: 'sdf',
        target_vdev: 'vdev-guid',
        allow_duplicate_serials: true,
      },
    ]);
  });
});
