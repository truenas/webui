import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DockerImagesComponentStore, DockerImagesState } from 'app/pages/apps/components/docker-images/docker-images.store';
import { fakeDockerImagesDataSource } from 'app/pages/apps/components/docker-images/test/fake-docker-images';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { DockerImagesListComponent } from './docker-images-list.component';

describe('DockerImagesListComponent', () => {
  let spectator: Spectator<DockerImagesListComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let store: DockerImagesComponentStore;

  const createComponent = createComponentFactory({
    component: DockerImagesListComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      DockerImagesComponentStore,
      mockWebsocket([
        mockCall('container.image.query', fakeDockerImagesDataSource),
        mockCall('container.image.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    store = spectator.inject(DockerImagesComponentStore);
  });

  it('should show table headers', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const headerRow = await table.getHeaderRow();

    expect(headerRow).toMatchObject({
      id: 'Image ID',
      repo_tags: 'Tags',
      size: 'Image Size',
      update: 'State',
      actions: '',
    });
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    const expectedRows = [
      ['', 'Image ID', 'Tags', 'Image Size', 'State', ''],
      ['', 'sha256:test1', 'truenas/webui:3.1', '725.07 KiB', 'Update available', ''],
      ['', 'sha256:test2', 'truenas/middleware:0.1.2', '5.82 MiB', 'Update available', ''],
    ];

    expect(ws.call).toHaveBeenCalledWith('container.image.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should show empty message when loaded and datasource is empty', async () => {
    store.setState({ isLoading: false, entities: [], error: null } as DockerImagesState);

    spectator.detectChanges();
    const emtpyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emtpyRow.getTitleText();

    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should show error message when can not retrieve response', async () => {
    store.setState({ error: 'Something went wrong', isLoading: false, entities: [] } as DockerImagesState);

    spectator.detectChanges();

    const emtpyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emtpyRow.getTitleText();

    expect(emptyTitle).toBe('Can not retrieve response');
  });
});
