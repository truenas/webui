import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { WebSocketService } from 'app/services';
import { DatasetService } from 'app/services/dataset-service/dataset.service';

describe('ReplicationRestoreDialogComponent', () => {
  let spectator: Spectator<ReplicationRestoreDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplicationRestoreDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('replication.restore'),
      ]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
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
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Name: 'Reverse task',
      Destination: '/mnt/dataset',
    });

    const save = await loader.getHarness(MatButtonHarness.with({ text: 'Restore' }));
    await save.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('replication.restore', [
      23,
      {
        name: 'Reverse task',
        target_dataset: '/mnt/dataset',
      },
    ]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
