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
  L2Cache = 'L2CACHE',
  Replacing = 'REPLACING',
}

export enum CreateVdevLayout {
  Stripe = 'STRIPE',
  Mirror = 'MIRROR',
  Raidz1 = 'RAIDZ1',
  Raidz2 = 'RAIDZ2',
  Raidz3 = 'RAIDZ3',
}

export enum TopologyWarning {
  MixedVdevLayout = 'Mixed VDEV types',
  MixedVdevCapacity = 'Mixed VDEV capacities',
  MixedDiskCapacity = 'Mixed Disk Capacities',
  MixedVdevWidth = 'Mixed VDEV widths',
  NoRedundancy = 'No redundancy',
  RedundancyMismatch = 'Redundancy Mismatch',
}
