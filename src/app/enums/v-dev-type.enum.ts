import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
// eslint-disable-next-line no-restricted-imports
import { helptextManager } from '../helptext/storage/volumes/manager/manager';

// TODO: This may actually be several enums. Consider splitting.
export enum TopologyItemType {
  Disk = 'DISK',
  Stripe = 'STRIPE',
  Mirror = 'MIRROR',
  Spare = 'SPARE',
  Log = 'LOG',
  Missing = 'MISSING',
  Root = 'ROOT',
  File = 'FILE',
  Raidz = 'RAIDZ',
  Raidz1 = 'RAIDZ1',
  Raidz2 = 'RAIDZ2',
  Raidz3 = 'RAIDZ3',
  Draid = 'DRAID',
  L2Cache = 'L2CACHE',
  Replacing = 'REPLACING',
}

export enum CreateVdevLayout {
  Stripe = 'STRIPE',
  Mirror = 'MIRROR',
  Raidz1 = 'RAIDZ1',
  Raidz2 = 'RAIDZ2',
  Raidz3 = 'RAIDZ3',
  Draid1 = 'DRAID1',
  Draid2 = 'DRAID2',
  Draid3 = 'DRAID3',
}

export const vdevLayoutOptions = [
  {
    label: T('Stripe'),
    value: CreateVdevLayout.Stripe,
    hoverTooltip: helptextManager.stripeTooltip,
  },
  {
    label: T('Mirror'),
    value: CreateVdevLayout.Mirror,
    hoverTooltip: helptextManager.mirrorTooltip,
  },
  {
    label: T('RAIDZ1'),
    value: CreateVdevLayout.Raidz1,
    hoverTooltip: helptextManager.raidz1Tooltip,
  },
  {
    label: T('RAIDZ2'),
    value: CreateVdevLayout.Raidz2,
    hoverTooltip: helptextManager.raidz2Tooltip,
  },
  {
    label: T('RAIDZ3'),
    value: CreateVdevLayout.Raidz3,
    hoverTooltip: helptextManager.raidz3Tooltip,
  },
  {
    label: T('dRAID1'),
    value: CreateVdevLayout.Draid1,
    hoverTooltip: helptextManager.dRaidTooltip,
  },
  {
    label: T('dRAID2'),
    value: CreateVdevLayout.Draid2,
    hoverTooltip: helptextManager.dRaidTooltip,
  },
  {
    label: T('dRAID3'),
    value: CreateVdevLayout.Draid3,
    hoverTooltip: helptextManager.dRaidTooltip,
  },
];

export enum TopologyWarning {
  MixedVdevLayout = 'Mixed VDEV types',
  MixedVdevCapacity = 'Mixed VDEV Capacities',
  MixedDiskCapacity = 'Mixed Disk Capacities',
  MixedVdevWidth = 'Mixed VDEV Widths',
  NoRedundancy = 'No Redundancy',
  RedundancyMismatch = 'Redundancy Mismatch',
}

export enum VDevType {
  Cache = 'cache',
  Data = 'data',
  Dedup = 'dedup',
  Log = 'log',
  Spare = 'spare',
  Special = 'special',
}

export const vdevTypeLabels = new Map<VDevType, string>([
  [VDevType.Data, T('Data')],
  [VDevType.Log, T('Log')],
  [VDevType.Special, T('Metadata')],
  [VDevType.Spare, T('Spare')],
  [VDevType.Dedup, T('Dedup')],
  [VDevType.Cache, T('Cache')],
]);
