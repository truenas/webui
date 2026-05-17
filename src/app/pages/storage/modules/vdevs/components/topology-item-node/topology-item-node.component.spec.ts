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

  it('shows "Errors"', () => {
    expect(spectator.query('.cell-errors')).toHaveText('6 Errors');
  });

  describe('parent VDEV status reflects worst child', () => {
    function makeChild(status: TopologyItemStatus): TopologyDisk {
      return {
        type: TopologyItemType.Disk,
        status,
        children: [] as TopologyDisk[],
        disk: 'sdx',
      } as TopologyDisk;
    }

    function makeRaidz(status: TopologyItemStatus, children: TopologyDisk[]): VDev {
      return {
        type: TopologyItemType.Raidz3,
        status,
        children,
      } as VDev;
    }

    it('shows FAULTED red when a child disk is faulted but parent reports ONLINE', () => {
      spectator.setInput('topologyItem', makeRaidz(TopologyItemStatus.Online, [
        makeChild(TopologyItemStatus.Online),
        makeChild(TopologyItemStatus.Faulted),
        makeChild(TopologyItemStatus.Online),
      ]));

      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Faulted);
      expect(spectator.query('.cell-status')).toHaveClass('fn-theme-red');
    });

    it('shows DEGRADED yellow when worst child is degraded', () => {
      spectator.setInput('topologyItem', makeRaidz(TopologyItemStatus.Online, [
        makeChild(TopologyItemStatus.Online),
        makeChild(TopologyItemStatus.Degraded),
      ]));

      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Degraded);
      expect(spectator.query('.cell-status')).toHaveClass('fn-theme-yellow');
    });

    it('keeps parent status when it is already worse than any child', () => {
      spectator.setInput('topologyItem', makeRaidz(TopologyItemStatus.Faulted, [
        makeChild(TopologyItemStatus.Online),
        makeChild(TopologyItemStatus.Degraded),
      ]));

      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Faulted);
      expect(spectator.query('.cell-status')).toHaveClass('fn-theme-red');
    });

    it('leaves ONLINE parent uncolored when all children are healthy', () => {
      spectator.setInput('topologyItem', makeRaidz(TopologyItemStatus.Online, [
        makeChild(TopologyItemStatus.Online),
        makeChild(TopologyItemStatus.Online),
      ]));

      expect(spectator.query('.cell-status span')).toHaveText(TopologyItemStatus.Online);
      expect(spectator.query('.cell-status')).not.toHaveClass('fn-theme-red');
      expect(spectator.query('.cell-status')).not.toHaveClass('fn-theme-yellow');
    });
  });
});
