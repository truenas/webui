import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TreeHarness } from 'app/modules/ix-tree/testing/tree.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
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
  let api: MockApiService;

  const createComponent = createComponentFactory({
    component: BootStatusListComponent,
    imports: [
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('boot.get_state', poolInstance),
        mockCall('boot.detach'),
      ]),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      BootenvNodeItemComponent,
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
  });

  it('loads boot pool state and shows it when one disk', async () => {
    expect(api.call).toHaveBeenCalledWith('boot.get_state');

    const tree = await loader.getHarness(TreeHarness);
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
