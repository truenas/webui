import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DockerImagesComponentStore, DockerImagesState } from 'app/pages/applications/docker-images/docker-images.store';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { DockerImagesListComponent } from './docker-images-list.component';

export const fakeDockerImagesDataSource = [{
  id: 'sha256:test1',
  labels: {},
  repo_tags: [
    'truenas/webui:3.1',
  ],
  size: 742472,
  created: {
    $date: 1513776649000,
  },
  dangling: false,
  update_available: true,
  system_image: true,
}, {
  id: 'sha256:test2',
  labels: {},
  repo_tags: [
    'truenas/middleware:0.1.2',
  ],
  size: 6099268,
  created: {
    $date: 1558543231000,
  },
  dangling: false,
  update_available: true,
  system_image: true,
}] as ContainerImage[];

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
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2022-01-06 16:36:06')),
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table headers', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const headerRow = await table.getHeaderRow();

    expect(headerRow).toMatchObject({
      id: 'Image ID',
      repo_tags: 'Tags',
      created: 'Date Created',
      size: 'Image Size',
      update: 'State',
      actions: '',
    });
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    const expectedRows = [
      ['', 'Image ID', 'Tags', 'Date Created', 'Image Size', 'State', ''],
      ['', 'sha256:test2', 'truenas/middleware:0.1.2', '2022-01-06 16:36:06', '5.82 MiB', 'Update available', 'more_vert'],
      ['', 'sha256:test1', 'truenas/webui:3.1', '2022-01-06 16:36:06', '725.07 KiB', 'Update available', 'more_vert'],
    ];

    expect(ws.call).toHaveBeenCalledWith('container.image.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should show empty message when loaded and datasource is empty', async () => {
    store.setState({ isLoading: false, entities: [], error: null } as DockerImagesState);

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No Docker Images are available']]);
  });

  it('should show error message when can not retrieve response', async () => {
    store.setState({ error: 'Something went wrong', isLoading: false, entities: [] } as DockerImagesState);

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Docker Images could not be loaded']]);
  });
});
