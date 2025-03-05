import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { DiskIoBus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ChangeRootDiskSetupComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/change-root-disk-setup/change-root-disk-setup.component';

describe('ChangeRootDiskSetupComponent', () => {
  let spectator: Spectator<ChangeRootDiskSetupComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ChangeRootDiskSetupComponent,
    providers: [
      mockApi([
        mockJob('virt.instance.update', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 'test',
          root_disk_size: 2 * GiB,
          root_disk_io_bus: DiskIoBus.VirtioBlk,
        } as VirtualizationInstance,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current root disk size', async () => {
    const form = await loader.getHarness(IxFormHarness);

    expect(await form.getValues()).toEqual({
      'Root Disk Size (in GiB)': '2',
      'Root Disk I/O Bus': 'Virtio-BLK',
    });
  });

  it('increases root disk size when new value is set', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Root Disk Size (in GiB)': '4',
      'Root Disk I/O Bus': 'NVMe',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.update', [
      'test',
      { root_disk_size: 4, root_disk_io_bus: DiskIoBus.Nvme },
    ]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(4);
  });

  it('does not allow value that is smaller than previous root disk size', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Root Disk Size (in GiB)': '1',
    });

    const input = await form.getControl('Root Disk Size (in GiB)');
    expect(await input.getErrorText()).toBe('Minimum value is 2');
  });
});
