import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk, VDev } from 'app/interfaces/storage.interface';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-icon/topology-item-icon.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-node/topology-item-node.component';

describe('TopologyItemNodeComponent', () => {
  let spectator: Spectator<TopologyItemNodeComponent>;
  const topologyDisk = {
    type: TopologyItemType.Disk,
    path: '/path/to/disk',
    guid: '123',
    status: TopologyItemStatus.Offline,
    stats: {
      read_errors: 1,
      write_errors: 2,
      checksum_errors: 3,
    },
    children: [] as TopologyDisk[],
    disk: 'sdf',
  } as TopologyDisk;
  const disk = {
    type: DiskType.Hdd,
    size: 16 * MiB,
  } as Disk;
  const createComponent = createComponentFactory({
    component: TopologyItemNodeComponent,
    declarations: [
      MockComponent(TopologyItemIconComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { disk, topologyItem: topologyDisk },
    });
  });

  it('shows "VDEV Name"', () => {
    expect(spectator.query('.name')).toHaveText(topologyDisk.disk);
    expect(spectator.query(TopologyItemIconComponent)!.disk).toBe(disk);
    expect(spectator.query(TopologyItemIconComponent)!.topologyItem).toBe(topologyDisk);
  });

  it('shows "Status"', () => {
    expect(spectator.query('.cell-status span')).toHaveText(topologyDisk.status);
    expect(spectator.query('.cell-status')).toHaveClass('fn-theme-yellow');
  });

  it('shows "Capacity"', () => {
    expect(spectator.query('.cell-capacity')).toHaveText('16 MiB');
  });

  it('shows "Errors" and highlights the cell when count > 0', () => {
    expect(spectator.query('.cell-errors')).toHaveText('6 Errors');
    expect(spectator.query('.cell-errors')).toHaveClass('fn-theme-red');
  });

  it('does not highlight the errors cell when count is zero', () => {
    spectator.setInput('topologyItem', {
      ...topologyDisk,
      stats: {
        ...topologyDisk.stats,
        read_errors: 0,
        write_errors: 0,
        checksum_errors: 0,
      },
    });
    expect(spectator.query('.cell-errors')).toHaveText('No errors');
    expect(spectator.query('.cell-errors')).not.toHaveClass('fn-theme-red');
  });

  describe('descendant warning icon', () => {
    const onlineChild = {
      type: TopologyItemType.Disk,
      status: TopologyItemStatus.Online,
      children: [] as TopologyDisk[],
    } as TopologyDisk;

    const offlineChild = {
      type: TopologyItemType.Disk,
      status: TopologyItemStatus.Offline,
      children: [] as TopologyDisk[],
    } as TopologyDisk;

    const unavailChild = {
      type: TopologyItemType.Disk,
      status: TopologyItemStatus.Unavail,
      children: [] as TopologyDisk[],
    } as TopologyDisk;

    const faultedChild = {
      type: TopologyItemType.Disk,
      status: TopologyItemStatus.Faulted,
      children: [] as TopologyDisk[],
    } as TopologyDisk;

    const buildVdev = (children: TopologyDisk[]): VDev => ({
      type: TopologyItemType.Raidz3,
      status: TopologyItemStatus.Degraded,
      children,
    } as VDev);

    it('hides the warning icon when no descendant is broken (own status irrelevant)', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, onlineChild]));
      expect(spectator.query('.descendant-warning-icon')).toBeNull();
    });

    it('hides the warning icon for leaf disks (no children)', () => {
      // Leaf disks don't need a descendant warning — their own row already shows their status.
      expect(spectator.query('.descendant-warning-icon')).toBeNull();
    });

    it('shows a yellow warning icon when worst descendant is DEGRADED/OFFLINE/REMOVED', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, offlineChild]));
      const icon = spectator.query('.descendant-warning-icon');
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass('severity-warning');
      expect(icon).not.toHaveClass('severity-critical');
    });

    it('shows a red warning icon when any descendant is UNAVAIL', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, unavailChild]));
      const icon = spectator.query('.descendant-warning-icon');
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass('severity-critical');
    });

    it('shows a red warning icon when any descendant is FAULTED', () => {
      spectator.setInput('topologyItem', buildVdev([onlineChild, faultedChild]));
      expect(spectator.query('.descendant-warning-icon')).toHaveClass('severity-critical');
    });

    it('does not change the parent status text/badge — that stays as reported by the API', () => {
      // The parent VDEV's own status (e.g. DEGRADED) must keep showing in the status cell.
      // The icon is a separate scannability hint and never modifies what zpool reports.
      spectator.setInput('topologyItem', buildVdev([onlineChild, unavailChild]));
      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Degraded);
      expect(spectator.query('.cell-status')).toHaveClass('fn-theme-yellow');
    });
  });
});
