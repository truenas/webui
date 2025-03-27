import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DiskIoBus } from 'app/enums/virtualization.enum';
import { VirtualizationDisk, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ChangeBootFromDiskComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-disks/change-boot-from-disk/change-boot-from-disk.component';

describe('ChangeBootFromDiskComponent', () => {
  let spectator: Spectator<ChangeBootFromDiskComponent>;
  let loader: HarnessLoader;

  const mockDisk = {
    source: 'test1Disk',
    name: 'test1Disk',
    io_bus: DiskIoBus.Nvme,
  } as VirtualizationDisk;

  const createComponent = createComponentFactory({
    component: ChangeBootFromDiskComponent,
    providers: [
      mockApi([
        mockCall('virt.instance.set_bootable_disk'),
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
          instance: {
            id: 'testInstance',
            root_disk_size: 2 * GiB,
            root_disk_io_bus: DiskIoBus.VirtioBlk,
          } as VirtualizationInstance,
          primaryBootDisk: mockDisk,
          visibleDisks: [
            mockDisk,
            {
              source: 'test2Disk',
              name: 'test2Disk',
              io_bus: DiskIoBus.Nvme,
            } as VirtualizationDisk,
          ],
        },
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
      'Boot From': 'test1Disk',
    });
  });

  it('changes boot from disk', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Boot From': 'test2Disk',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.set_bootable_disk', [
      'testInstance',
      'test2Disk',
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('test2Disk');
  });
});
