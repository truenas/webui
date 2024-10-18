import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { WebSocketService } from 'app/services/ws.service';

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
  let spectator: Spectator<DockerImageDeleteDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DockerImageDeleteDialogComponent,
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
        provide: MAT_DIALOG_DATA,
        useValue: fakeDockerImagesDataSource,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockWebSocket([
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
    spectator.inject(MockWebSocketService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    expect(spectator.fixture.nativeElement).toHaveText('The following 2 docker images will be deleted. Are you sure you want to proceed?');

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('2 docker images has been deleted.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
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
    spectator.inject(MockWebSocketService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
      Force: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
  });

  it('checks deleting failures of docker images when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = [
      'app.image.delete',
      [
        ['sha256:test1', { force: false }],
        ['sha256:test2', { force: false }],
      ],
    ];
    spectator.inject(MockWebSocketService).mockJob('core.bulk', fakeSuccessfulJob(mockFailedBulkResponse, jobArguments));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    expect(spectator.fixture.nativeElement).toHaveText('Warning: 2 of 2 docker images could not be deleted.');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="close"]' }));
    await closeButton.click();
  });
});
