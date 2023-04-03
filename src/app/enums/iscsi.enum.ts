export enum IscsiAuthMethod {
  None = 'NONE',
  Chap = 'CHAP',
  ChapMutual = 'CHAP_MUTUAL',
}

export enum IscsiTargetMode {
  Iscsi = 'ISCSI',
  Fc = 'FC',
  Both = 'BOTH',
}

export enum IscsiExtentType {
  Disk = 'DISK',
  File = 'FILE',
}

export enum IscsiExtentRpm {
  Unknown = 'UNKNOWN',
  Ssd = 'SSD',
  Rpm5400 = '5400',
  Rpm7200 = '7200',
  Rpm10000 = '10000',
  Rpm15000 = '15000',
}

export enum IscsiExtentUsefor {
  Vmware = 'vmware',
  Xen = 'xen',
  Legacyos = 'legacyos',
  Modernos = 'modernos',
}

export enum IscsiNewOption {
  New = 'NEW',
}
