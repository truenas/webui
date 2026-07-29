import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnDialogHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
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
  ReplaceDiskDialogData,
  ReplaceDiskDialog,
} from 'app/pages/storage/modules/vdevs/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';

describe('ReplaceDiskDialogComponent', () => {
  let spectator: Spectator<ReplaceDiskDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplaceDiskDialog,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockApi([
        mockCall('disk.details', {
          unused: [
            { devname: 'sdb', identifier: '{serial_lunid}BBBBB1', size: 10 * GiB },
          ] as DetailsDisk[],
          used: [],
        }),
        mockJob('pool.replace', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(SnackbarService),
      {
        provide: DIALOG_DATA,
        useValue: {
          poolId: 1,
          guid: '9804554747743380831',
          diskName: 'sda',
        } as ReplaceDiskDialogData,
      },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a name of the disk that is about to be replaced', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);

    expect(await dialog.getTitle()).toBe('Replacing disk sda');
  });

  it('replaces a disk when the form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
    });

    const force = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }));
    await force.check();

    const replaceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.replace', [
      1,
      {
        disk: '{serial_lunid}BBBBB1',
        force: true,
        label: '9804554747743380831',
        preserve_description: true,
        preserve_settings: true,
      },
    ]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows additional settings to preserve disk settings and description', async () => {
    const preserveSettings = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Preserve Power Management settings' }),
    );
    await preserveSettings.uncheck();

    const preserveDescription = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Preserve disk description' }),
    );
    await preserveDescription.uncheck();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
    });

    const replaceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.replace', [
      1,
      {
        disk: '{serial_lunid}BBBBB1',
        force: false,
        label: '9804554747743380831',
        preserve_description: false,
        preserve_settings: false,
      },
    ]);
  });
});
