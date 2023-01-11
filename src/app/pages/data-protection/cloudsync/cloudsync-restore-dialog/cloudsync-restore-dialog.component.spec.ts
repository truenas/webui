import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService2 } from 'app/services/ws2.service';
import { CloudsyncRestoreDialogComponent } from './cloudsync-restore-dialog.component';

describe('CloudsyncRestoreDialogComponent', () => {
  let spectator: Spectator<CloudsyncRestoreDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CloudsyncRestoreDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    declarations: [
      TransferModeExplanationComponent,
    ],
    providers: [
      mockWebsocket(),
      mockWebsocket2([
        mockCall('cloudsync.restore'),
      ]),
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

    expect(spectator.inject(WebSocketService2).call).toHaveBeenCalledWith('cloudsync.restore', [
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
