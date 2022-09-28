import { TranslateService } from '@ngx-translate/core';

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
  hidden?: boolean;
}

export function getReportTypeLabels(translate: TranslateService): Map<ReportType, string> {
  return new Map([
    [ReportType.Cpu, translate.instant('CPU')],
    [ReportType.Disk, translate.instant('Disk')],
    [ReportType.Memory, translate.instant('Memory')],
    [ReportType.Network, translate.instant('Network')],
    [ReportType.Nfs, translate.instant('NFS')],
    [ReportType.Partition, translate.instant('Partition')],
    [ReportType.System, translate.instant('System')],
    [ReportType.Ups, translate.instant('UPS')],
    [ReportType.Target, translate.instant('Target')],
    [ReportType.Zfs, translate.instant('ZFS')],
  ]);
}
