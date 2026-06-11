import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerImageDeleteDialog } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';

const mockSuccessBulkResponse = [{
  result: null,
  error: null,
}, {
  result: null,
  error: null,
}] as CoreBulkResponse[];

const mockFailedBulkResponse = [{
  result: null,
  error: 'conflict: unable to delete f1d8a00ae690 (cannot be forced) - image is being used by running container 7cf3ae9b1fc5',
}, {
  result: null,
  error: 'conflict: unable to delete 9957eafb3901 (must be forced) - image is referenced in multiple repositories',
}] as CoreBulkResponse[];

describe('DockerImageDeleteDialogComponent', () => {
  let spectator: Spectator<DockerImageDeleteDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DockerImageDeleteDialog,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      BulkListItemComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: fakeDockerImagesDataSource,
      },
      mockProvider(LoaderService),
      mockProvider(DialogRef),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockApi([
        mockJob('core.bulk'),
        mockCall('app.image.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes selected docker images when form is submitted', async () => {
    const jobArguments = [
      'app.image.delete',
      [
        ['sha256:test1', { force: false }],
        ['sha256:test2', { force: false }],
      ],
    ];
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    expect(spectator.fixture.nativeElement).toHaveText('The following 2 docker images will be deleted. Are you sure you want to proceed?');

    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('2 docker images has been deleted.');

    const closeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Close' }));
    await closeButton.click();
  });

  it('checks force delete of docker images when form is submitted', async () => {
    const jobArguments = [
      'app.image.delete',
      [
        ['sha256:test1', { force: true }],
        ['sha256:test2', { force: true }],
      ],
    ];
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    const forceCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }));
    await forceCheckbox.check();
    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
  });

  it('checks deleting failures of docker images when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = [
      'app.image.delete',
      [
        ['sha256:test1', { force: false }],
        ['sha256:test2', { force: false }],
      ],
    ];
    spectator.inject(MockApiService).mockJob('core.bulk', fakeSuccessfulJob(mockFailedBulkResponse, jobArguments));

    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('Warning: 2 of 2 docker images could not be deleted.');

    const closeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Close' }));
    await closeButton.click();
  });
});
