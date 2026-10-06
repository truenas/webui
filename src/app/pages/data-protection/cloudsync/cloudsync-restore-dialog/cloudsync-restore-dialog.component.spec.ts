import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedCall('cloudsync.restore', null),
      ]),
      mockProvider(DialogService),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    const descriptionInput = await loader.getHarness(TnInputHarness);
    await descriptionInput.setValue('Reverse task');

    const transferModeSelect = await loader.getHarness(TnSelectHarness);
    await transferModeSelect.selectOption(/SYNC/);

    // The explorer sits inside a `tn-form-field` that owns its label, so it is located by control
    // name rather than by label text.
    const pathExplorer = await loader.getHarness(
      IxExplorerHarness.with({ selector: '[formControlName="path"]' }),
    );
    await pathExplorer.setValue('/mnt/dir');

    const save = await loader.getHarness(TnButtonHarness.with({ label: 'Restore' }));
    await save.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.restore', [
      23,
      {
        description: 'Reverse task',
        path: '/mnt/dir',
        transfer_mode: TransferMode.Sync,
      },
    ]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
