import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { BootenvNodeItemComponent } from './bootenv-node-item.component';

describe('BootenvNodeItemComponent', () => {
  let spectator: Spectator<BootenvNodeItemComponent>;
  const topologyItem = {
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
      data: [topologyItem],
    },
  } as PoolInstance;

  const createComponent = createComponentFactory({
    component: BootenvNodeItemComponent,
    providers: [
      mockAuth(),
    ],
    declarations: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { node: topologyItem, poolInstance },
    });
  });

  it('shows boot pool name', () => {
    expect(spectator.query('.cell-name')).toHaveText('sda3');
  });

  it('shows pool status', () => {
    expect(spectator.query('.cell-status')).toHaveText('ONLINE');
  });
});
