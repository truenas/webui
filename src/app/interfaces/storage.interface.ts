import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { ZfsProperty } from './zfs-property.interface';

// As returned by pool.query under topology[<vdevtype>]
export type TopologyItem = VDev | TopologyDisk;

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

export function isTopologyDisk(topologyItem: TopologyItem): topologyItem is TopologyDisk {
  return topologyItem.type === TopologyItemType.Disk;
}

export function isVdev(topologyItem: TopologyItem): topologyItem is VDev {
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
}

export interface EnclosureAndSlot {
  number: number;
  slot: number;
}

export interface Disk {
  advpowermgmt: DiskPowerLevel;
  bus: DiskBus;
  critical: number;
  description: string;
  devname: string;
  difference: number;
  duplicate_serial: string[];
  enclosure: EnclosureAndSlot;
  expiretime: string;
  hddstandby: DiskStandby;
  identifier: string;
  informational: number;
  lunid?: string;
  model: string;
  multipath_member: string;
  multipath_name: string;
  name: string;
  number: number;
  passwd?: string;
  pool: string;
  rotationrate: number;
  serial: string;
  size: number;
  smartoptions: string;
  subsystem: string;
  supports_smart?: boolean;
  togglesmart: boolean;
  transfermode: string;
  type: DiskType;
  zfs_guid: string;
  tests?: SmartTestResult[];
}

export interface StorageDashboardDisk extends Disk {
  alerts: Alert[];
  smartTestsRunning: number;
  smartTestsFailed: number;
  tempAggregates: TemperatureAgg;
}

/**
 * Additional disk query options
 */
export interface ExtraDiskQueryOptions {
  extra?: {
    /**
     * Will also include expired disks.
     */
    include_expired?: boolean;

    /**
     * Will not hide KMIP password for the disks.
     */
    passwords?: boolean;

    /**
     * Will join pool name for each disk.
     */
    pools?: boolean;
  };
}

export interface DiskUpdate {
  togglesmart?: boolean;
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  passwd?: string;
  smartoptions?: string;
  critical?: number;
  difference?: number;
  informational?: number;
  enclosure?: EnclosureAndSlot;
  number?: number;
  pool?: string;
}

export interface UnusedDisk extends Disk {
  partitions: {
    path: string;
  }[];
  exported_zpool: string;
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
  xattr: ZfsProperty<string>;
}

export type DiskWipeParams = [
  disk: string,
  method: DiskWipeMethod,
];

export interface DiskTemperatures {
  [disk: string]: number | null;
}

export interface DiskTemperatureAgg {
  [disk: string]: TemperatureAgg;
}

export interface TemperatureAgg {
  min: number;
  max: number;
  avg: number;
}
