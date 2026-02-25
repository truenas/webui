import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { TopologyDisk, TopologyItemStats, VDev, VDevItem } from 'app/interfaces/storage.interface';
import {
  countTopologyErrors,
  flattenDiskTopology,
  getDisksWithErrors,
} from './disk-errors.helper';

const createStats = (
  readErrors = 0,
  writeErrors = 0,
  checksumErrors = 0,
): TopologyItemStats => ({
  timestamp: 131065847939755,
  read_errors: readErrors,
  write_errors: writeErrors,
  checksum_errors: checksumErrors,
  ops: [0, 0, 0, 0, 0, 0, 0],
  bytes: [0, 0, 0, 0, 0, 0, 0],
  size: 16642998272,
  allocated: 0,
  fragmentation: 0,
  self_healed: 0,
  configured_ashift: 12,
  logical_ashift: 0,
  physical_ashift: 0,
} as TopologyItemStats);

const createDisk = (
  name: string,
  stats: TopologyItemStats,
): TopologyDisk => ({
  name,
  type: TopologyItemType.Disk,
  path: `/dev/disk/by-partuuid/${name}`,
  guid: '4851255968580818534',
  status: TopologyItemStatus.Online,
  stats,
  children: [],
  device: 'sda',
  disk: 'sda',
  unavail_disk: null,
} as TopologyDisk);

const createMirror = (
  name: string,
  stats: TopologyItemStats,
  children: VDevItem[] = [],
): VDev => ({
  name,
  type: TopologyItemType.Mirror,
  guid: '15021255127715885506',
  status: TopologyItemStatus.Online,
  stats,
  children,
  unavail_disk: null,
} as VDev);

describe('flattenDiskTopology', () => {
  it('should flatten a simple topology with only disks', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const topology: PoolTopology = {
      data: [disk1, disk2],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = flattenDiskTopology(topology);

    expect(result).toHaveLength(2);
    expect(result).toContain(disk1);
    expect(result).toContain(disk2);
  });

  it('should flatten nested VDEVs with children', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const mirror = createMirror('mirror-0', createStats(), [disk1, disk2]);
    const topology: PoolTopology = {
      data: [mirror],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = flattenDiskTopology(topology);

    expect(result).toHaveLength(3);
    expect(result).toContain(mirror);
    expect(result).toContain(disk1);
    expect(result).toContain(disk2);
  });

  it('should handle multiple VDEV categories', () => {
    const dataDisk = createDisk('data-disk', createStats());
    const logDisk = createDisk('log-disk', createStats());
    const cacheDisk = createDisk('cache-disk', createStats());
    const topology: PoolTopology = {
      data: [dataDisk],
      log: [logDisk],
      cache: [cacheDisk],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = flattenDiskTopology(topology);

    expect(result).toHaveLength(3);
    expect(result).toContain(dataDisk);
    expect(result).toContain(logDisk);
    expect(result).toContain(cacheDisk);
  });

  it('should handle VDevItem array input', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const items: VDevItem[] = [disk1, disk2];

    const result = flattenDiskTopology(items);

    expect(result).toHaveLength(2);
    expect(result).toContain(disk1);
    expect(result).toContain(disk2);
  });

  it('should handle deeply nested structures', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const innerMirror = createMirror('inner-mirror', createStats(), [disk1, disk2]);
    const disk3 = createDisk('disk3', createStats());
    const outerMirror = createMirror('outer-mirror', createStats(), [innerMirror, disk3]);
    const topology: PoolTopology = {
      data: [outerMirror],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = flattenDiskTopology(topology);

    expect(result).toHaveLength(5);
    expect(result).toContain(outerMirror);
    expect(result).toContain(innerMirror);
    expect(result).toContain(disk1);
    expect(result).toContain(disk2);
    expect(result).toContain(disk3);
  });
});

describe('getDisksWithErrors', () => {
  it('should return disks with read errors', () => {
    const diskWithErrors = createDisk('disk-error', createStats(5, 0, 0));
    const diskWithoutErrors = createDisk('disk-ok', createStats());
    const topology: PoolTopology = {
      data: [diskWithErrors, diskWithoutErrors],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(diskWithErrors);
  });

  it('should return disks with write errors', () => {
    const diskWithErrors = createDisk('disk-error', createStats(0, 3, 0));
    const diskWithoutErrors = createDisk('disk-ok', createStats());
    const topology: PoolTopology = {
      data: [diskWithErrors, diskWithoutErrors],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(diskWithErrors);
  });

  it('should return disks with checksum errors', () => {
    const diskWithErrors = createDisk('disk-error', createStats(0, 0, 2));
    const diskWithoutErrors = createDisk('disk-ok', createStats());
    const topology: PoolTopology = {
      data: [diskWithErrors, diskWithoutErrors],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(diskWithErrors);
  });

  it('should return multiple disks with any combination of errors', () => {
    const disk1 = createDisk('disk1', createStats(1, 0, 0));
    const disk2 = createDisk('disk2', createStats(0, 2, 0));
    const disk3 = createDisk('disk3', createStats(0, 0, 3));
    const disk4 = createDisk('disk4', createStats(1, 1, 1));
    const diskOk = createDisk('disk-ok', createStats());
    const topology: PoolTopology = {
      data: [disk1, disk2, disk3, disk4, diskOk],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(4);
    expect(result).toContain(disk1);
    expect(result).toContain(disk2);
    expect(result).toContain(disk3);
    expect(result).toContain(disk4);
  });

  it('should return VDEVs with errors in nested structures', () => {
    const disk1 = createDisk('disk1', createStats(1, 0, 0));
    const disk2 = createDisk('disk2', createStats());
    const mirrorWithErrors = createMirror('mirror-error', createStats(0, 5, 0), [disk1, disk2]);
    const topology: PoolTopology = {
      data: [mirrorWithErrors],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(2);
    expect(result).toContain(mirrorWithErrors);
    expect(result).toContain(disk1);
  });

  it('should return empty array when no errors exist', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const topology: PoolTopology = {
      data: [disk1, disk2],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(0);
  });

  it('should handle items without stats', () => {
    const diskWithoutStats = createDisk('disk', createStats());
    delete diskWithoutStats.stats;
    const topology: PoolTopology = {
      data: [diskWithoutStats],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = getDisksWithErrors(topology);

    expect(result).toHaveLength(0);
  });
});

describe('countTopologyErrors', () => {
  it('should count errors for all items when predicate always returns true', () => {
    const disk1 = createDisk('disk1', createStats(1, 2, 3));
    const disk2 = createDisk('disk2', createStats(4, 5, 6));
    const topology: PoolTopology = {
      data: [disk1, disk2],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(() => true, topology);

    expect(result).toBe(21); // (1+2+3) + (4+5+6) = 21
  });

  it('should count errors only for disks', () => {
    const disk1 = createDisk('disk1', createStats(1, 1, 1));
    const disk2 = createDisk('disk2', createStats(2, 2, 2));
    const mirror = createMirror('mirror-0', createStats(10, 10, 10), [disk1, disk2]);
    const topology: PoolTopology = {
      data: [mirror],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(
      (item) => item.type === TopologyItemType.Disk,
      topology,
    );

    expect(result).toBe(9); // (1+1+1) + (2+2+2) = 9, mirror errors excluded
  });

  it('should count errors only for VDEVs (not disks)', () => {
    const disk1 = createDisk('disk1', createStats(5, 5, 5));
    const disk2 = createDisk('disk2', createStats(5, 5, 5));
    const mirror = createMirror('mirror-0', createStats(1, 2, 3), [disk1, disk2]);
    const topology: PoolTopology = {
      data: [mirror],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(
      (item) => item.type !== TopologyItemType.Disk,
      topology,
    );

    expect(result).toBe(6); // 1+2+3 = 6, disk errors excluded
  });

  it('should return 0 when no items match predicate', () => {
    const disk1 = createDisk('disk1', createStats(1, 1, 1));
    const disk2 = createDisk('disk2', createStats(2, 2, 2));
    const topology: PoolTopology = {
      data: [disk1, disk2],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(() => false, topology);

    expect(result).toBe(0);
  });

  it('should return 0 when no errors exist', () => {
    const disk1 = createDisk('disk1', createStats());
    const disk2 = createDisk('disk2', createStats());
    const topology: PoolTopology = {
      data: [disk1, disk2],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(() => true, topology);

    expect(result).toBe(0);
  });

  it('should handle items without stats', () => {
    const disk = createDisk('disk', createStats(5, 5, 5));
    delete disk.stats;
    const topology: PoolTopology = {
      data: [disk],
      log: [],
      cache: [],
      spare: [],
      special: [],
      dedup: [],
    };

    const result = countTopologyErrors(() => true, topology);

    expect(result).toBe(0);
  });

  it('should work with VDevItem array input', () => {
    const disk1 = createDisk('disk1', createStats(1, 1, 1));
    const disk2 = createDisk('disk2', createStats(2, 2, 2));
    const items: VDevItem[] = [disk1, disk2];

    const result = countTopologyErrors(() => true, items);

    expect(result).toBe(9); // (1+1+1) + (2+2+2) = 9
  });
});
