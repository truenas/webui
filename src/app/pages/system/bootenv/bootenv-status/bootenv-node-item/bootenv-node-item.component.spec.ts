import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyDisk, VDev } from 'app/interfaces/storage.interface';
import { BootPoolActionType } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
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
    children: [] as TopologyDisk[],
  } as TopologyDisk;

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
    expect(spectator.query('.cell-status')).toHaveText('Online');
  });

  async function openActionsMenu(): Promise<TnMenuHarness> {
    spectator.click(spectator.query('button[aria-label="Actions"]')!);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('does not offer Detach on the disk of a single-disk boot pool', async () => {
    spectator.setInput('oneDisk', true);

    const menu = await openActionsMenu();
    expect(await menu.getItemLabels()).toEqual(['Replace', 'Attach']);
  });

  describe('mirrored boot pool', () => {
    const member = {
      ...topologyItem,
      name: '/dev/vdb3',
      path: '/dev/vdb3',
      guid: '5513806441215632751',
    } as TopologyDisk;

    const mirror = {
      name: 'mirror-0',
      type: TopologyItemType.Mirror,
      guid: '8047127003581040126',
      status: TopologyItemStatus.Online,
      children: [topologyItem, member],
    } as VDev;

    beforeEach(() => {
      spectator.setInput({
        node: member,
        poolInstance: { ...poolInstance, topology: { data: [mirror] } } as PoolInstance,
        oneDisk: false,
      });
    });

    it('offers Detach on a member disk of the mirror, and emits it for that disk', async () => {
      const emitted = jest.fn();
      spectator.output('invokeAction').subscribe(emitted);

      const menu = await openActionsMenu();
      expect(await menu.getItemLabels()).toEqual(['Replace', 'Detach']);

      await menu.clickItem({ label: 'Detach' });
      expect(emitted).toHaveBeenCalledWith({ action: BootPoolActionType.Detach, node: member });
    });
  });
});
