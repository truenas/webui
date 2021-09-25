import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { ZfsProperty } from './zfs-property.interface';

// As returned by pool.query under topology[<vdevtype>]
export interface VDev {
  type: string; // 'DISK'
  path: string;
  guid: string;
  status: string;
  children: this[];
  unavail_disk: any;
  stats: VDevStats;

  // TODO: These fields are not present in pool.query response
  device?: string;
  disk?: string;
}

export interface VDevStats {
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

// As returned by disk.query
export interface EnclosureSlot {
  number: number;
  slot: number;
}

export interface Disk {
  advpowermgmt: DiskPowerLevel;
  critical: string;
  description: string;
  devname: string;
  difference: string;
  enclosure: EnclosureSlot;
  expiretime: string;
  hddstandby: DiskStandby;
  hddstandby_force: string;
  identifier: string;
  informational: string;
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
  togglesmart: boolean;
  transfermode: string;
  type: string;
  zfs_guid: string;
}

/**
 * Additional disk query options
 */
export interface DiskQueryOptions {
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
}

export interface DiskUpdate {
  togglesmart?: boolean;
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  hddstandby_force?: boolean;
  passwd?: string;
  smartoptions?: string;
  critical?: number;
  difference?: number;
  informational?: number;
  enclosure?: EnclosureSlot;
  number: number;
  pool: string;
}

export interface UnusedDisk extends Disk {
  partitions: {
    path: string;
  }[];
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
