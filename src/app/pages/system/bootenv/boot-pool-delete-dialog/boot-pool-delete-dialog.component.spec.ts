import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { BootPoolDeleteDialog } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
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
  let spectator: Spectator<BootPoolDeleteDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: BootPoolDeleteDialog,
    imports: [
      ReactiveFormsModule,
      BulkListItemComponent,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: fakeBootEnvironmentsDataSource,
      },
      mockProvider(LoaderService),
      mockProvider(DialogRef),
      mockProvider(DialogService),
      // Each test scripts its own `core.bulk` outcome.
      mockTypedApi(),
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
    spectator.inject(MockTypedApiService).mockJob('core.bulk', { state: JobState.Success, result: mockSuccessBulkResponse, arguments: jobArguments });

    expect(spectator.fixture.nativeElement).toHaveText('The following 2 boot environments will be deleted. Are you sure you want to proceed?');

    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('2 boot environments has been deleted.');

    const closeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Close' }));
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
    spectator.inject(MockTypedApiService).mockJob('core.bulk', { state: JobState.Success, result: mockFailedBulkResponse, arguments: jobArguments });

    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('Warning: 2 of 2 boot environments could not be deleted.');

    const closeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Close' }));
    await closeButton.click();
  });

  it('does not delete boot environments when the form is submitted natively while invalid', () => {
    spectator.query('form')!.dispatchEvent(new Event('submit'));

    expect(spectator.inject(TypedApiService).job).not.toHaveBeenCalledWith('core.bulk', expect.anything());
  });
});
