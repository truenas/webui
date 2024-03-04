import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { DockerImagesListComponent } from './docker-images-list.component';

describe('DockerImagesListComponent', () => {
  let spectator: Spectator<DockerImagesListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: DockerImagesListComponent,
    imports: [
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    declarations: [
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('container.image.query', fakeDockerImagesDataSource),
        mockCall('container.image.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Image ID', 'Tags', 'Image Size', 'Update available', ''],
      ['sha256:test1', 'truenas/webui:3.1', '725.07 KiB', 'Yes', ''],
      ['sha256:test2', 'truenas/middleware:0.1.2', '5.82 MiB', 'Yes', ''],
    ];

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('container.image.query');
    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('opens update dialog when "Update" button is pressed', async () => {
    const updateButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'update' }), 'sha256:test1');
    await updateButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DockerImageUpdateDialogComponent, {
      data: [fakeDockerImagesDataSource[0]],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'delete' }), 'sha256:test1');
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DockerImageDeleteDialogComponent, {
      data: [fakeDockerImagesDataSource[0]],
    });
  });

  it('opens form when "Pull Image" button is pressed', async () => {
    const pullImageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Pull Image' }));
    await pullImageButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(PullImageFormComponent);
  });
});
