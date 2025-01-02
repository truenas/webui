import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { fakeBootEnvironmentsDataSource } from 'app/pages/system/bootenv/test/fake-boot-environments';

const mockSuccessBulkResponse = [{
  result: null,
  error: null,
}, {
  result: null,
  error: null,
}] as CoreBulkResponse[];

const mockFailedBulkResponse = [{
  result: null,
  error: 'Something went wrong!',
}, {
  result: null,
  error: 'Something went wrong!',
}] as CoreBulkResponse[];

describe('BootPoolDeleteDialogComponent', () => {
  let spectator: Spectator<BootPoolDeleteDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: BootPoolDeleteDialogComponent,
    imports: [
      ReactiveFormsModule,
      BulkListItemComponent,
    ],
    providers: [
      mockAuth(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeBootEnvironmentsDataSource,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockApi([
        mockJob('core.bulk'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes selected boot environments when form is submitted', async () => {
    const jobArguments = [
      'boot.environment.destroy',
      [
        [{ id: '25.04.0-MASTER-20241031-104807' }],
        [{ id: '25.04.0-MASTER-20241105-224807' }],
      ],
    ];
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    expect(spectator.fixture.nativeElement).toHaveText('The following 2 boot environments will be deleted. Are you sure you want to proceed?');

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('2 boot environments has been deleted.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();
  });

  it('checks deleting failures of boot environments when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = [
      'boot.environment.destroy',
      [
        [{ id: '25.04.0-MASTER-20241031-104807' }],
        [{ id: '25.04.0-MASTER-20241105-224807' }],
      ],
    ];
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(mockFailedBulkResponse, jobArguments));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('Warning: 2 of 2 boot environments could not be deleted.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();
  });
});
