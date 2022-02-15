import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppLoaderModule } from 'app/modules/app-loader/app-loader.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/storage/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { fakeZfsSnapshotDataSource } from 'app/pages/storage/snapshots/testing/snapshot-fake-datasource';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

describe('SnapshotBatchDeleteDialogComponent', () => {
  let spectator: Spectator<SnapshotBatchDeleteDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SnapshotBatchDeleteDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2021-11-05 10:52:06')),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeZfsSnapshotDataSource,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('core.bulk'),
        mockCall('zfs.snapshot.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  xit('checks default messages', () => {
    expect(spectator.fixture.nativeElement).toHaveText('Use snapshot latest-snapshot-name to roll test-dataset back to 2021-11-05 10:52:06?');
    expect(spectator.fixture.nativeElement).toHaveText('Rolling the dataset back destroys data on the dataset');
  });

  xit('checks getting additional properties query is called', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.query', [[['id', '=', 'test-dataset@latest-snapshot-name']]]);
  });

  xit('rollback dataset to selected snapshot when form is submitted and shows a success message', async () => {
    // TODO: Check when NAS-114799 is done
    // Add test for different recursive values

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rollback' }));
    await rollbackButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('zfs.snapshot.rollback', [
      'test-dataset@latest-snapshot-name',
      { force: true },
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Dataset rolled back to snapshot latest-snapshot-name.');
  });
});
