import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { ZfsProperty } from './zfs-property.interface';

// As returned by pool.query under topology[<vdevtype>].
// `isRoot` is set by the UI when nesting items in the tree view.
export type VDevItem = (VDev | TopologyDisk) & { isRoot?: boolean };

// UI projection produced by `VDevsStore`: each node carries a precomputed `effectiveStatus`
// so consumers don't recurse on every render. `effectiveStatus` reflects the worst status
// reached by walking the node and its descendants (see topology-status.helper).
export type VDevItemEnriched = (VDev | TopologyDisk) & {
  isRoot?: boolean;
  effectiveStatus: TopologyItemStatus;
};

export interface VDev {
  type: Exclude<TopologyItemType, TopologyItemType.Disk>;
  children: TopologyDisk[];
  guid: string;
  name: string;
  path: string;
  stats: TopologyItemStats;
  status: TopologyItemStatus;
  unavail_disk: unknown;
  disk?: string;
}

export interface TopologyDisk {
  type: TopologyItemType.Disk;
  children: TopologyDisk[];
  device: string;
  disk: string;
  guid: string;
  name: string;
  path: string;
  stats: TopologyItemStats;
  status: TopologyItemStatus;
  unavail_disk: unknown;
}

export function isTopologyDisk(topologyItem: VDevItem): topologyItem is TopologyDisk {
  return topologyItem.type === TopologyItemType.Disk;
}

export function isVdev(topologyItem: VDevItem): topologyItem is VDev {
  return topologyItem.type !== TopologyItemType.Disk;
}

export interface TopologyItemStats {
  timestamp: number;
  read_errors: number;
  write_errors: number;
  checksum_errors: number;
  ops: number[];
  bytes: number[];
  size: number;
  allocated: number;
  fragmentation: number;
  self_healed: number;
  configured_ashift: number;
  logical_ashift: number;
  physical_ashift: number;
  draid_data_disks?: number;
  draid_spare_disks?: number;
  draid_parity?: number;
}

export interface EnclosureAndSlot {
  drive_bay_number: number;
  id: string; // Enclosure id.
}

/**
 * As returned by snapshot.query
 */
export interface Snapshot {
  name: string;
  snapshot: string;
  dataset: string;
  created?: string;
  properties?: ZfsProperties;
  referenced?: string;
  used?: string;
}

export interface ZfsProperties {
  acltype: ZfsProperty<string>;
  casesensitivity: ZfsProperty<string>;
  clones: ZfsProperty<string>;
  compressratio: ZfsProperty<string>;
  context: ZfsProperty<string>;
  createtxg: ZfsProperty<string>;
  creation: ZfsProperty<string>;
  defcontext: ZfsProperty<string>;
  defer_destroy: ZfsProperty<string>;
  devices: ZfsProperty<string>;
  encryption: ZfsProperty<string>;
  encryptionroot: ZfsProperty<string>;
  exec: ZfsProperty<string>;
  fscontext: ZfsProperty<string>;
  guid: ZfsProperty<string>;
  inconsistent: ZfsProperty<string>;
  ivsetguid: ZfsProperty<string>;
  keyguid: ZfsProperty<string>;
  keystatus: ZfsProperty<string>;
  logicalreferenced: ZfsProperty<string>;
  mlslabel: ZfsProperty<string>;
  name: ZfsProperty<string>;
  nbmand: ZfsProperty<string>;
  normalization: ZfsProperty<string>;
  numclones: ZfsProperty<string>;
  objsetid: ZfsProperty<string>;
  primarycache: ZfsProperty<string>;
  redact_snaps: ZfsProperty<string>;
  redacted: ZfsProperty<string>;
  refcompressratio: ZfsProperty<string>;
  referenced: ZfsProperty<string>;
  remaptxg: ZfsProperty<string>;
  rootcontext: ZfsProperty<string>;
  secondarycache: ZfsProperty<string>;
  setuid: ZfsProperty<string>;
  type: ZfsProperty<string>;
  unique: ZfsProperty<string>;
  used: ZfsProperty<string>;
  useraccounting: ZfsProperty<string>;
  userrefs: ZfsProperty<string>;
  utf8only: ZfsProperty<string>;
  version: ZfsProperty<string>;
  volsize: ZfsProperty<string>;
  written: ZfsProperty<string>;
}

export interface TemperatureAgg {
  min: number;
  max: number;
  avg: number;
}
