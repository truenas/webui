import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { TopologyDisk, TopologyItemStats } from 'app/interfaces/storage.interface';
import { countDisksTotal } from './count-disks-total.helper';

const stats: TopologyItemStats = {
  timestamp: 131065847939755,
  read_errors: 0,
  write_errors: 0,
  checksum_errors: 0,
  ops: [0, 0, 0, 0, 0, 0, 0],
  bytes: [0, 0, 0, 0, 0, 0, 0],
  size: 16642998272,
  allocated: 0,
  fragmentation: 0,
  self_healed: 0,
  configured_ashift: 12,
  logical_ashift: 0,
  physical_ashift: 0,
};

const disk: TopologyDisk = {
  name: 'afb11bc3-859e-4ebf-a570-cce9b4be967d',
  type: TopologyItemType.Disk,
  path: '/dev/disk/by-partuuid/afb11bc3-859e-4ebf-a570-cce9b4be967d',
  guid: '4851255968580818534',
  status: TopologyItemStatus.Online,
  stats,
  children: [],
  device: 'sda2',
  disk: 'sda',
  unavail_disk: null,
};

const buildTopology = ({ addDisks }: { addDisks: boolean }): PoolTopology => {
  return {
    data: [
      {
        name: 'mirror-0',
        type: TopologyItemType.Mirror,
        path: null,
        guid: '15021255127715885506',
        status: TopologyItemStatus.Online,
        stats,
        children: addDisks ? [disk, disk] : [],
        unavail_disk: null,
      },
    ],
    log: addDisks ? [disk] : [],
    cache: [],
    spare: addDisks ? [disk] : [],
    special: [],
    dedup: addDisks ? [disk] : [],
  };
};

describe('HELPER: countDisksTotal', () => {
  it('should count disks total based on topology, if mirror has children, we count children with device type', () => {
    expect(countDisksTotal(buildTopology({ addDisks: true }))).toBe('5');
  });

  it('should show 0 total disks', () => {
    expect(countDisksTotal(buildTopology({ addDisks: false }))).toBe('0');
  });
});
