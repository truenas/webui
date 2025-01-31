/**
 * Note!
 * Before editing or removing a WidgetType,
 * consider users who may already have this widget type in their user attributes.
 *
 * Provide migration if possible.
 */
export enum WidgetType {
  App = 'app',
  AppCpu = 'app-cpu',
  AppNetwork = 'app-network',
  AppMemory = 'app-memory',
  AppInfo = 'app-info',
  Ipv4Address = 'ipv4-address',
  Ipv6Address = 'ipv6-address',
  Help = 'help',
  Memory = 'memory',
  Interface = 'interface',
  BackupTasks = 'backup-tasks',
  Cpu = 'cpu',
  CpuUsageGauge = 'cpu-usage-gauge',
  CpuUsageRecent = 'cpu-usage-recent',
  CpuUsageBar = 'cpu-usage-bar',
  CpuTemperatureBar = 'cpu-temperature-bar',
  Storage = 'storage',
  SystemInfoActive = 'system-info-active',
  SystemInfoPassive = 'system-info-passive',
  HostnameActive = 'hostname-active',
  HostnamePassive = 'hostname-passive',
  OsVersion = 'os-version',
  SystemUptime = 'system-uptime',
  SystemImage = 'system-image',
  Pool = 'pool',
  PoolUsageGauge = 'pool-usage-gauge',
  PoolStatus = 'pool-status',
  PoolDisksWithZfsErrors = 'pool-disk-with-zfs-errors',
  PoolLastScanErrors = 'pool-last-scan-errors',
  ArbitraryText = 'arbitrary-text',
  SerialActive = 'serial-active',
  SerialPassive = 'serial-passive',
  CpuModelWidget = 'cpu-model-widget',
  CpuTempWidget = 'cpu-temp-widget',
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

export type SomeWidgetSettings = object | null;
