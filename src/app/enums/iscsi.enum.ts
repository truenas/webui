import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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

export const iscsiExtentUseforMap = new Map([
  [IscsiExtentUsefor.Vmware, T('VMware: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed')],
  [IscsiExtentUsefor.Xen, T('Xen: Extent block size 512b, TPC enabled, Xen compat mode enabled, SSD speed')],
  [IscsiExtentUsefor.Legacyos, T('Legacy OS: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed')],
  [IscsiExtentUsefor.Modernos, T('Modern OS: Extent block size 4k, TPC enabled, no Xen compat mode, SSD speed')],
]);

export const iscsiTargetModeNames = new Map<IscsiTargetMode, string>([
  [IscsiTargetMode.Iscsi, T('iSCSI')],
  [IscsiTargetMode.Fc, T('Fibre Channel')],
  [IscsiTargetMode.Both, T('Both')],
]);
