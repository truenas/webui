import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { AppLoaderModule } from 'app/modules/app-loader/app-loader.module';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { DialogService, WebSocketService } from 'app/services';

const snapshot = {
  dataset: 'my-dataset',
  snapshot_name: 'snapshot-name',
  properties: {
    creation: {
      parsed: {
        $date: 1634575914000,
      },
    },
  },
} as ZfsSnapshot;

describe('SnapshotRollbackDialogComponent', () => {
  let spectator: Spectator<SnapshotRollbackDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SnapshotRollbackDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => 'Jan 10 2022 10:36')),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: snapshot,
      },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('zfs.snapshot.rollback'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks default value in recursive type radio group', async () => {
    const radioGroup = await loader.getHarness(IxRadioGroupHarness);
    expect(await radioGroup.getValue()).toEqual('on');
  });

  it('rollback dataset to selected snapshot when form is submitted and shows a success message', async () => {
    const radioGroup = await loader.getHarness(IxRadioGroupHarness);
    await radioGroup.setValue('recursive');

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      snapshot.snapshot_name,
      {
        recursive: true,
        force: true,
      },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot snapshot-name.');
  });
});
