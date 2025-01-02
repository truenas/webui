import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  RaidzExtendDialogComponent, RaidzExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/raidz-extend-dialog/raidz-extend-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

describe('RaidzExtendDialogComponent', () => {
  let spectator: Spectator<RaidzExtendDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RaidzExtendDialogComponent,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
      FileSizePipe,
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
              size: 12 * TiB,
            },
            {
              devname: 'sdf',
              name: 'sdf',
              size: 10 * TiB,
            },
          ] as DetailsDisk[],
          used: [],
        }),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(DevicesStore, {
        diskDictionary$: of({
          sda: {
            name: 'sda',
            size: 12 * TiB,
          },
          sdb: {
            name: 'sdb',
            size: 12 * TiB,
          },
        }),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          poolId: 4,
          vdev: {
            children: [
              { disk: 'sda' },
              { disk: 'sdb' },
            ],
            guid: 'vdev-guid',
          } as VDev,
        } as RaidzExtendDialogParams,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('only shows disks that are at least the same size as than smallest disk in a vdev', async () => {
    const warningMessage = spectator.query(byText('Only disks that are at least 12 TiB are shown.'));
    expect(warningMessage).toExist();

    const combobox = await loader.getHarness(IxComboboxHarness.with({ label: 'New Disk' }));
    await combobox.focusInput();
    const options = await combobox.getAutocompleteOptions();
    expect(options).toEqual(['sde (12 TiB)']);
  });

  it('extends a vdev when new unused disk is selected', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'New Disk': 'sde (12 TiB)',
    });

    const extendButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
    await extendButton.click();

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
});
