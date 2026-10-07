import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { JobResult } from '@truenas/api-client';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SnapshotBatchDeleteDialog } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { fakeZfsSnapshotDataSource } from 'app/pages/datasets/modules/snapshots/testing/snapshot-fake-datasource';

const mockJobSuccessResponse = [{
  result: true,
}, {
  result: true,
}] as CoreBulkResponse[];

describe('SnapshotBatchDeleteDialogComponent', () => {
  let spectator: Spectator<SnapshotBatchDeleteDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SnapshotBatchDeleteDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: fakeZfsSnapshotDataSource,
      },
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockProvider(DialogRef),
      mockProvider(DialogService),
      mockTypedApi([
        mockTypedJob('core.bulk', { state: JobState.Success, result: mockJobSuccessResponse as JobResult<WebUiApiDirectory, 'core.bulk'> }),
        mockTypedCall('pool.snapshot.delete', null),
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
    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('core.bulk', [
      'pool.snapshot.delete',
      [
        ['test-dataset@first-snapshot'],
        ['test-dataset@second-snapshot'],
      ],
    ]);
    expect(spectator.inject(LoaderService).withLoader).toHaveBeenCalled();
    expect(spectator.fixture.nativeElement).toHaveText('Deleted 2 snapshots');
  });

  it('should disable delete button when form is invalid', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });
});
