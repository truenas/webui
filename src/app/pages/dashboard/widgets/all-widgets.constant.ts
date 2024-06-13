import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { backupTasksWidget } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.definition';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { cpuTemperatureBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.definition';
import { cpuUsageGaugeWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.definition';
import { cpuUsageRecentWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.definition';
import { cpuUsageBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usege-bar/widget-cpu-usage-bar.definition';
import { arbitraryTextWidget } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.definition';
import { helpWidget } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.definition';
import { memoryWidget } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.definition';
import { hostnameWidget } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.definition';
import { ipv4AddressWidget, ipv6AddressWidget } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { networkWidget } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.definition';
import { poolNameWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-name/widget-pool-name.definition';
import { storageWidget } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.definition';
import { osVersionWidget } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.definition';
import { systemInfoActiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.definition';
import { systemInfoPassiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.definition';
import { systemImageWidget } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.definition';
import { systemUptimeWidget } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.definition';

export const widgetComponents = [
  hostnameWidget.component,
  ipv4AddressWidget.component,
  ipv4AddressWidget.settingsComponent,
  helpWidget.component,
  memoryWidget.component,
  networkWidget.component,
  backupTasksWidget.component,
  cpuWidget.component,
  cpuUsageGaugeWidget.component,
  cpuUsageRecentWidget.component,
  cpuUsageBarWidget.component,
  cpuTemperatureBarWidget.component,
  storageWidget.component,
  systemInfoActiveWidget.component,
  systemInfoPassiveWidget.component,
  osVersionWidget.component,
  systemUptimeWidget.component,
  systemImageWidget.component,
  poolNameWidget.component,
  poolNameWidget.settingsComponent,
  arbitraryTextWidget.component,
  arbitraryTextWidget.settingsComponent,
];

export const widgetRegistry = {
  [WidgetType.Hostname]: hostnameWidget,
  [WidgetType.PoolName]: poolNameWidget,
  [WidgetType.Ipv4Address]: ipv4AddressWidget,
  [WidgetType.Ipv6Address]: ipv6AddressWidget,
  [WidgetType.Help]: helpWidget,
  [WidgetType.Memory]: memoryWidget,
  [WidgetType.Network]: networkWidget,
  [WidgetType.BackupTasks]: backupTasksWidget,
  [WidgetType.Cpu]: cpuWidget,
  [WidgetType.CpuUsageGauge]: cpuUsageGaugeWidget,
  [WidgetType.CpuUsageRecentWidget]: cpuUsageRecentWidget,
  [WidgetType.CpuUsageBar]: cpuUsageBarWidget,
  [WidgetType.CpuTemperatureBar]: cpuTemperatureBarWidget,
  [WidgetType.Storage]: storageWidget,
  [WidgetType.SystemInfoActive]: systemInfoActiveWidget,
  [WidgetType.SystemInfoPassive]: systemInfoPassiveWidget,
  [WidgetType.OsVersion]: osVersionWidget,
  [WidgetType.SystemUptime]: systemUptimeWidget,
  [WidgetType.SystemImage]: systemImageWidget,
  [WidgetType.ArbitraryText]: arbitraryTextWidget,
};
