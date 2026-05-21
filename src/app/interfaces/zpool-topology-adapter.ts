import { TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import {
  TopologyDisk, TopologyItemStats, VDev, VDevItem,
} from 'app/interfaces/storage.interface';
import { Zpool } from 'app/interfaces/zpool.interface';

/**
 * `zpool.query` returns topology items in raw ZFS shape (e.g. `vdev_type`,
 * `state`, stats with `space`/`ops_read`/`bytes_read`). The rest of the UI was
 * built against the older `pool.query` shape (`type`, `status`, stats with
 * `size`/`ops[]`/`bytes[]`). Adapt at the store boundary so consumers don't
 * have to care which endpoint produced the data.
 */

interface WireStats {
  timestamp?: number;
  read_errors?: number;
  write_errors?: number;
  checksum_errors?: number;
  ops_read?: number;
  ops_write?: number;
  bytes_read?: number;
  bytes_write?: number;
  space?: number;
  allocated?: number;
  fragmentation?: number;
  self_healed_bytes?: number;
  configured_ashift?: number;
  logical_ashift?: number;
  physical_ashift?: number;
}

interface WireVdev {
  name: string;
  vdev_type: string;
  guid: number | string;
  state: string;
  stats?: WireStats;
  children?: WireVdev[];
}

type WireTopology = Partial<Record<VDevType, WireVdev[]>>;

function adaptStats(wire: WireStats | undefined): TopologyItemStats {
  return {
    timestamp: wire?.timestamp ?? 0,
    read_errors: wire?.read_errors ?? 0,
    write_errors: wire?.write_errors ?? 0,
    checksum_errors: wire?.checksum_errors ?? 0,
    ops: [wire?.ops_read ?? 0, wire?.ops_write ?? 0],
    bytes: [wire?.bytes_read ?? 0, wire?.bytes_write ?? 0],
    size: wire?.space ?? 0,
    allocated: wire?.allocated ?? 0,
    fragmentation: wire?.fragmentation ?? 0,
    self_healed: wire?.self_healed_bytes ?? 0,
    configured_ashift: wire?.configured_ashift ?? 0,
    logical_ashift: wire?.logical_ashift ?? 0,
    physical_ashift: wire?.physical_ashift ?? 0,
  };
}

/**
 * Wire disk names look like `/dev/sdb1` or `/dev/nvme0n1p1`. The UI matches
 * disks against inventory by bare device name (`sdb`, `nvme0n1`).
 */
const nvmePartitionRegex = /^(.+)p\d+$/;
const trailingDigitsRegex = /\d+$/;

function deriveDevname(wireName: string): string {
  const trimmed = wireName.replace(/^\/dev\//, '');
  const nvmeMatch = nvmePartitionRegex.exec(trimmed);
  if (nvmeMatch) {
    return nvmeMatch[1];
  }
  return trimmed.replace(trailingDigitsRegex, '');
}

function adaptVdevItem(wire: WireVdev): VDevItem {
  const status = wire.state as TopologyItemStatus;
  const stats = adaptStats(wire.stats);
  const guid = String(wire.guid);

  if (wire.vdev_type === 'disk') {
    const devname = deriveDevname(wire.name);
    const disk: TopologyDisk = {
      type: TopologyItemType.Disk,
      name: devname,
      disk: devname,
      device: wire.name,
      path: wire.name,
      guid,
      status,
      stats,
      children: [],
      unavail_disk: null,
    };
    return disk;
  }

  const vdev: VDev = {
    type: wire.vdev_type.toUpperCase() as VDev['type'],
    name: wire.name,
    path: '',
    guid,
    status,
    stats,
    children: (wire.children ?? []).map(adaptVdevItem) as TopologyDisk[],
    unavail_disk: null,
  };
  return vdev;
}

function adaptCategory(items: WireVdev[] | undefined): VDevItem[] {
  return (items ?? []).map(adaptVdevItem);
}

export function adaptZpoolTopology(zpool: Zpool): Zpool {
  if (!zpool.topology) {
    return zpool;
  }
  const wire = zpool.topology as unknown as WireTopology;
  const topology: PoolTopology = {
    [VDevType.Data]: adaptCategory(wire[VDevType.Data]),
    [VDevType.Log]: adaptCategory(wire[VDevType.Log]),
    [VDevType.Cache]: adaptCategory(wire[VDevType.Cache]),
    [VDevType.Spare]: adaptCategory(wire[VDevType.Spare]),
    [VDevType.Special]: adaptCategory(wire[VDevType.Special]),
    [VDevType.Dedup]: adaptCategory(wire[VDevType.Dedup]),
  };
  return { ...zpool, topology };
}
