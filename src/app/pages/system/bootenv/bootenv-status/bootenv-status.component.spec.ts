import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { IxTreeHarness } from 'app/modules/ix-tree/testing/ix-tree.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
import { DialogService } from 'app/services';
import { BootenvNodeItemComponent } from './bootenv-node-item/bootenv-node-item.component';

const oneDisk = {
  name: 'sda3',
  type: TopologyItemType.Disk,
  path: '/dev/sda3',
  guid: '1909089035164712918',
  status: TopologyItemStatus.Online,
  stats: {
    timestamp: 65023816157559,
    read_errors: 0,
    write_errors: 0,
    checksum_errors: 0,
    size: 20401094656,
    allocated: 5607686144,
    fragmentation: 4,
  },
  children: [],
  device: null,
  disk: null,
} as TopologyItem;

const poolInstance = {
  guid: 'boot-pool',
  name: 'boot-pool',
  path: '/',
  status: PoolStatus.Online,
  size: 20401094656,
  allocated: 16723320832,
  scan: {
    end_time: {
      $date: 1643309114000,
    },
  },
  topology: {
    data: [oneDisk],
  },
} as PoolInstance;

describe('BootStatusListComponent', () => {
  let spectator: Spectator<BootStatusListComponent>;
  let loader: HarnessLoader;
  let websocket: MockWebsocketService;

  const createComponent = createComponentFactory({
    component: BootStatusListComponent,
    imports: [
      AppLoaderModule,
      TranslateModule,
      CoreComponents,
      IxTreeModule,
      IxIconModule,
      MatIconTestingModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
      mockWebsocket([
        mockCall('boot.get_state', poolInstance),
      ]),
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => '2022-01-27 20:45:14')),
      BootenvNodeItemComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(MockWebsocketService);
  });

  it('loads boot pool state and shows it when one disk', async () => {
    expect(websocket.call).toHaveBeenCalledWith('boot.get_state');

    const tree = await loader.getHarness(IxTreeHarness);
    const nodes = await tree.getNodes();
    expect(nodes).toHaveLength(2);

    const firstNodeText = await nodes[0].getText();
    expect(firstNodeText).toContain('boot-pool');
    expect(firstNodeText).toContain('ONLINE');
    expect(firstNodeText).toContain('No Errors');

    const secondNodeText = await nodes[1].getText();
    expect(secondNodeText).toContain('sda3');
    expect(secondNodeText).toContain('ONLINE');
    expect(secondNodeText).toContain('No Errors');
  });
});
