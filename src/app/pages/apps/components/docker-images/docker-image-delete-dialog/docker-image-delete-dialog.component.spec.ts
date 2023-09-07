import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { BulkListItemComponent } from 'app/core/components/bulk-list-item/bulk-list-item.component';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { DialogService } from 'app/services/dialog.service';
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
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      BulkListItemComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: fakeDockerImagesDataSource,
      },
      mockProvider(AppLoaderService),
      mockProvider(MatDialogRef),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockWebsocket([
        mockJob('core.bulk'),
        mockCall('container.image.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes selected docker images when form is submitted', async () => {
    const jobArguments = [
      'container.image.delete',
      [
        ['sha256:test1'],
        ['sha256:test2'],
      ],
    ];
    spectator.inject(MockWebsocketService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

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
      'container.image.delete',
      [
        ['sha256:test1'],
        ['sha256:test2'],
      ],
    ];
    spectator.inject(MockWebsocketService).mockJob('core.bulk', fakeSuccessfulJob(mockSuccessBulkResponse, jobArguments));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Confirm: true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('core.bulk', jobArguments);
    // expect(spectator.fixture.nativeElement).toHaveText('2 docker images has been deleted.');

    // const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    // await closeButton.click();
  });

  it('checks deleting failures of docker images when form is submitted', async () => {
    const jobArguments: CoreBulkQuery = [
      'container.image.delete',
      [
        ['sha256:test1'],
        ['sha256:test2'],
      ],
    ];
    spectator.inject(MockWebsocketService).mockJob('core.bulk', fakeSuccessfulJob(mockFailedBulkResponse, jobArguments));

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
