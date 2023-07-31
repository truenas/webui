import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { SnapshotCloneDialogComponent } from './snapshot-clone-dialog.component';

describe('SnapshotCloneDialogComponent', () => {
  let spectator: Spectator<SnapshotCloneDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SnapshotCloneDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'my-snapshot',
      },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('zfs.snapshot.clone'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sets default value in dataset name input', async () => {
    const input = await loader.getHarness(IxInputHarness);
    expect(await input.getValue()).toBe('my-snapshot-clone');
  });

  it('clones snapshot to a dataset when form is submitted and shows a success message', async () => {
    const input = await loader.getHarness(IxInputHarness);
    await input.setValue('pool/dataset');

    const cloneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clone' }));
    await cloneButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.clone', [{
      dataset_dst: 'pool/dataset',
      snapshot: 'my-snapshot',
    }]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset pool/dataset was created.');
  });
});
