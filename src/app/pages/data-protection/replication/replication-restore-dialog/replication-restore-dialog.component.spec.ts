import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ReplicationRestoreDialog,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { DatasetService } from 'app/services/dataset/dataset.service';

describe('ReplicationRestoreDialogComponent', () => {
  let spectator: Spectator<ReplicationRestoreDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplicationRestoreDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('replication.restore'),
      ]),
      mockProvider(DialogService),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
        useValue: 23,
      },
      mockProvider(DatasetService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('restores a replication task when dialog form is submitted', async () => {
    const nameInput = await loader.getHarness(TnInputHarness);
    await nameInput.setValue('Reverse task');

    const destinationExplorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Destination' }));
    await destinationExplorer.setValue('/mnt/dataset');

    const save = await loader.getHarness(TnButtonHarness.with({ label: 'Restore' }));
    await save.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('replication.restore', [
      23,
      {
        name: 'Reverse task',
        target_dataset: '/mnt/dataset',
      },
    ]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
