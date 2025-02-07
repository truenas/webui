import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  IncreaseRootDiskSizeComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/increase-root-disk-size/increase-root-disk-size.component';

describe('IncreaseRootDiskSizeComponent', () => {
  let spectator: Spectator<IncreaseRootDiskSizeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IncreaseRootDiskSizeComponent,
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
      'Root Disk Size': '2 GiB',
    });
  });

  it('increases root disk size when new value is set', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Root Disk Size': '4 GiB',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.update', [
      'test',
      { root_disk_size: 4 * GiB },
    ]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('does not allow value that is smaller than previous root disk size', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Root Disk Size': '1',
    });

    const input = await form.getControl('Root Disk Size');
    expect(await input.getErrorText()).toBe('Minimum value is 2147483648');
  });
});
