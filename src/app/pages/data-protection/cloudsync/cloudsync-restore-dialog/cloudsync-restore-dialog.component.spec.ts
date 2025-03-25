import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { CloudSyncRestoreDialog } from './cloudsync-restore-dialog.component';

describe('CloudSyncRestoreDialogComponent', () => {
  let spectator: Spectator<CloudSyncRestoreDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CloudSyncRestoreDialog,
    imports: [
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('cloudsync.restore'),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: 23,
      },
      mockProvider(FilesystemService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('restores a cloudsync task when dialog form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Description: 'Reverse task',
      'Transfer Mode': 'SYNC',
      'Directory/Files': '/mnt/dir',
    });

    const save = await loader.getHarness(MatButtonHarness.with({ text: 'Restore' }));
    await save.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.restore', [
      23,
      {
        description: 'Reverse task',
        path: '/mnt/dir',
        transfer_mode: TransferMode.Sync,
      },
    ]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
