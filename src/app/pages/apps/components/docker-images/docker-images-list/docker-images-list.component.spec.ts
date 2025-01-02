import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { DockerImagesListComponent } from './docker-images-list.component';

describe('DockerImagesListComponent', () => {
  let spectator: Spectator<DockerImagesListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: DockerImagesListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
    ],
    declarations: [
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('app.image.query', fakeDockerImagesDataSource),
        mockCall('app.image.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['', 'Image ID', 'Tags', 'Image Size', ''],
      ['', 'sha256:test1', 'truenas/webui:3.1', '725.07 KiB', ''],
      ['', 'sha256:test2', 'truenas/middleware:0.1.2', '5.82 MiB', ''],
    ];

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.image.query');
    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'sha256:test1');
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DockerImageDeleteDialogComponent, {
      data: [fakeDockerImagesDataSource[0]],
    });
  });

  it('opens form when "Pull Image" button is pressed', async () => {
    const pullImageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Pull Image' }));
    await pullImageButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PullImageFormComponent);
  });
});
