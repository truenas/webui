/**
 * Note!
 * Before editing or removing a WidgetType,
 * consider users who may already have this widget type in their user attributes.
 *
 * Provide migration if possible.
 */
export enum WidgetType {
  App = 'app',
  Hostname = 'hostname',
  Ipv4Address = 'ipv4-address',
  Ipv6Address = 'ipv6-address',
  Help = 'help',
  Memory = 'memory',
  Interface = 'interface',
  BackupTasks = 'backup-tasks',
  Cpu = 'cpu',
  CpuUsageGauge = 'cpu-usage-gauge',
  CpuUsageRecentWidget = 'cpu-usage-recent',
  CpuUsageBar = 'cpu-usage-bar',
  CpuTemperatureBar = 'cpu-temperature-bar',
  Storage = 'storage',
  SystemInfoActive = 'system-info-active',
  SystemInfoPassive = 'system-info-passive',
  OsVersion = 'os-version',
  SystemUptime = 'system-uptime',
  SystemImage = 'system-image',
  Pool = 'pool',
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
