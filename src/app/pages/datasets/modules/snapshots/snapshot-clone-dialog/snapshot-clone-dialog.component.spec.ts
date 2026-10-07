import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SnapshotCloneDialog } from './snapshot-clone-dialog.component';

describe('SnapshotCloneDialogComponent', () => {
  let spectator: Spectator<SnapshotCloneDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SnapshotCloneDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: 'my-snapshot',
      },
      mockProvider(DialogRef),
      mockProvider(DialogService),
      mockTypedApi([
        mockTypedCall('pool.snapshot.clone', null),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sets default value in dataset name input', async () => {
    const input = await loader.getHarness(TnInputHarness);
    expect(await input.getValue()).toBe('my-snapshot-clone');
  });

  it('clones snapshot to a dataset when form is submitted and shows a success message', async () => {
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue('pool/dataset');

    const cloneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clone' }));
    await cloneButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('pool.snapshot.clone', [{
      dataset_dst: 'pool/dataset',
      snapshot: 'my-snapshot',
    }]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset pool/dataset was created.');
  });
});
