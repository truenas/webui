import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockWebsocket, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

const mockJobSuccessResponse = [{
  result: true,
}, {
  result: true,
}] as CoreBulkResponse[];

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
        mockJob('core.bulk', fakeSuccessfulJob(mockJobSuccessResponse)),
        mockCall('zfs.snapshot.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks default messages', () => {
    expect(spectator.fixture.nativeElement).toHaveText('The following 2 snapshots will be deleted. Are you sure you want to proceed?');
  });

  it('deletes selected snapshots when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', [
      'zfs.snapshot.delete',
      [
        ['test-dataset@first-snapshot'],
        ['test-dataset@second-snapshot'],
      ],
    ]);
    expect(spectator.fixture.nativeElement).toHaveText('Deleted 2 snapshots');
  });
});
