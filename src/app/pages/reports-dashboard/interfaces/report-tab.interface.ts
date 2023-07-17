import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ReportType {
  Cpu = 'cpu',
  Disk = 'disk',
  Memory = 'memory',
  Network = 'network',
  Nfs = 'nfs',
  Partition = 'partition',
  System = 'system',
  Ups = 'ups',
  Target = 'target',
  Zfs = 'zfs',
}

export interface ReportTab {
  label: string;
  value: ReportType;
}

export const reportTypeLabels = new Map<ReportType, string>([
  [ReportType.Cpu, T('CPU')],
  [ReportType.Disk, T('Disk')],
  [ReportType.Memory, T('Memory')],
  [ReportType.Network, T('Network')],
  [ReportType.Nfs, T('NFS')],
  [ReportType.Partition, T('Partition')],
  [ReportType.System, T('System')],
  [ReportType.Ups, T('UPS')],
  [ReportType.Target, T('Target')],
  [ReportType.Zfs, T('ZFS')],
]);
