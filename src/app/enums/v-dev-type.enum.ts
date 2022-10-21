// TODO: This may actually be several enums. Consider splitting.
export enum TopologyItemType {
  Disk = 'DISK',
  Mirror = 'MIRROR',
  Spare = 'SPARE',
  Log = 'LOG',
  Missing = 'MISSING',
  Root = 'ROOT',
  File = 'FILE',
  Raidz = 'RAIDZ',
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
