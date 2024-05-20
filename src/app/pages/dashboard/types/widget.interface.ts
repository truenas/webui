/**
 * Note!
 * Before editing or removing a WidgetType,
 * consider users who may already have this widget type in their user attributes.
 *
 * Provide migration if possible.
 */
export enum WidgetType {
  Hostname = 'hostname',
  Ipv4Address = 'ipv4-address',
  Ipv6Address = 'ipv6-address',
  Help = 'help',
  Memory = 'memory',
  Network = 'network',
  BackupTasks = 'backup-tasks',
  Cpu = 'cpu',
  SystemInfoActive = 'system-info-active',
  SystemInfoPassive = 'system-info-passive',
  OsVersion = 'os-version',
  PoolName = 'pool-name',
  ArbitraryText = 'arbitrary-text',
}

export enum SlotSize {
  Full = 'full',
  Half = 'half',
  Quarter = 'quarter',
}

export interface Widget {
  type: WidgetType;
  settings?: SomeWidgetSettings;
}

export type SomeWidgetSettings = object;
