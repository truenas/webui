import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ReplaceDiskDialogData,
  ReplaceDiskDialogComponent,
} from 'app/pages/storage/modules/devices/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ReplaceDiskDialogComponent', () => {
  let spectator: Spectator<ReplaceDiskDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplaceDiskDialogComponent,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('disk.details', {
          unused: [
            { devname: 'sdb', identifier: '{serial_lunid}BBBBB1', size: 10 * GiB },
          ] as DetailsDisk[],
          used: [],
        }),
        mockJob('pool.replace', fakeSuccessfulJob()),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(SnackbarService),
      {
        provide: MAT_DIALOG_DATA,
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

  it('shows a name of the disk that is about to be replaced', () => {
    const title = spectator.query('h1');

    expect(title).toHaveText('Replacing disk sda');
  });

  it('replaces a disk when the form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
      Force: true,
    });

    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('pool.replace', [
      1,
      {
        disk: '{serial_lunid}BBBBB1',
        force: true,
        label: '9804554747743380831',
        preserve_description: true,
        preserve_settings: true,
      },
    ]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows additional settings to preserve disk settings and description', async () => {
    const preserveSettings = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Preserve Power Management and S.M.A.R.T. settings' }),
    );
    await preserveSettings.setValue(false);

    const preserveDescription = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Preserve disk description' }),
    );
    await preserveDescription.setValue(false);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
    });

    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('pool.replace', [
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
