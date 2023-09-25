import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
// eslint-disable-next-line no-restricted-imports
import helptext from '../helptext/storage/volumes/manager/manager';

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
    hoverTooltip: helptext.stripeTooltip,
  },
  {
    label: T('Mirror'),
    value: CreateVdevLayout.Mirror,
    hoverTooltip: helptext.mirrorTooltip,
  },
  {
    label: T('RAIDZ1'),
    value: CreateVdevLayout.Raidz1,
    hoverTooltip: helptext.raidz1Tooltip,
  },
  {
    label: T('RAIDZ2'),
    value: CreateVdevLayout.Raidz2,
    hoverTooltip: helptext.raidz2Tooltip,
  },
  {
    label: T('RAIDZ3'),
    value: CreateVdevLayout.Raidz3,
    hoverTooltip: helptext.raidz3Tooltip,
  },
  {
    label: T('dRAID1'),
    value: CreateVdevLayout.Draid1,
    hoverTooltip: helptext.dRaidTooltip,
  },
  {
    label: T('dRAID2'),
    value: CreateVdevLayout.Draid2,
    hoverTooltip: helptext.dRaidTooltip,
  },
  {
    label: T('dRAID3'),
    value: CreateVdevLayout.Draid3,
    hoverTooltip: helptext.dRaidTooltip,
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

export enum VdevType {
  Cache = 'cache',
  Data = 'data',
  Dedup = 'dedup',
  Log = 'log',
  Spare = 'spare',
  Special = 'special',
}

export const vdevTypeLabels = new Map<VdevType, string>([
  [VdevType.Data, T('Data')],
  [VdevType.Log, T('Log')],
  [VdevType.Special, T('Special')],
  [VdevType.Spare, T('Spare')],
  [VdevType.Dedup, T('Dedup')],
  [VdevType.Cache, T('Cache')],
]);
