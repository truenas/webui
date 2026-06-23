import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnIconButtonHarness, TnSidePanelHarness, TnTableComponent, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerImageDeleteDialog } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { DockerImagesListComponent } from './docker-images-list.component';

describe('DockerImagesListComponent', () => {
  let spectator: Spectator<DockerImagesListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: DockerImagesListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('app.image.query', fakeDockerImagesDataSource),
        mockCall('app.image.delete'),
        mockJob('app.image.pull'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(ErrorHandlerService),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('queries the images and shows them as table rows', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.image.query');

    expect(await table.getRowCount()).toBe(2);
    expect(await table.getHeaderTexts()).toEqual(expect.arrayContaining(['Image ID', 'Tags', 'Image Size']));
    expect(await table.getCellText(0, 'id')).toBe('sha256:test1');
    expect(await table.getCellText(0, 'repo_tags')).toBe('truenas/webui:3.1');
    expect(await table.getCellText(0, 'size')).toBe('725.07 KiB');
    expect(await table.getCellText(1, 'id')).toBe('sha256:test2');
  });

  it('opens delete dialog when the row "Delete" button is pressed', async () => {
    const deleteButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'delete' }));
    await deleteButtons[0].click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DockerImageDeleteDialog, {
      data: [fakeDockerImagesDataSource[0]],
    });
  });

  it('shows the batch operations toolbar and bulk-deletes selected images', async () => {
    const tnTable = spectator.query(TnTableComponent);
    tnTable?.selectionChange.emit([fakeDockerImagesDataSource[0]]);
    spectator.detectChanges();

    const bulkDeleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await bulkDeleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DockerImageDeleteDialog, {
      data: [fakeDockerImagesDataSource[0]],
    });
  });

  it('opens the Pull Image form in a side panel when the "Pull Image" button is pressed', async () => {
    const pullImageButton = await loader.getHarness(TnButtonHarness.with({ label: 'Pull Image' }));
    await pullImageButton.click();

    const panel = await loader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(true);
    expect(spectator.query('ix-pull-image-form')).toBeTruthy();
  });
});
