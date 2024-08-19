import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { backupTasksWidget } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.definition';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { cpuModelWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-model/widget-cpu-model.definition';
import { cpuTemperatureBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.definition';
import { cpuUsageBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-bar/widget-cpu-usage-bar.definition';
import { cpuUsageGaugeWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.definition';
import { cpuUsageRecentWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.definition';
import { arbitraryTextWidget } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.definition';
import { helpWidget } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.definition';
import { memoryWidget } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.definition';
import { interfaceWidget } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.definition';
import { ipv4AddressWidget, ipv6AddressWidget } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { poolWidget } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { poolDisksWithZfsErrorsWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-disks-with-zfs-errors/widget-pool-disks-with-zfs-errors.definition';
import { poolLastScanErrorsWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-last-scan-errors/widget-pool-last-scan-errors.definition';
import { poolStatusWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-status/widget-pool-status.definition';
import { poolUsageGaugeWidget } from 'app/pages/dashboard/widgets/storage/widget-pool-usage-gauge/widget-pool-usage-gauge.definition';
import { storageWidget } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.definition';
import { hostnameActiveWidget } from 'app/pages/dashboard/widgets/system/widget-hostname-active/widget-hostname-active.definition';
import { hostnamePassiveWidget } from 'app/pages/dashboard/widgets/system/widget-hostname-passive/widget-hostname-passive.definition';
import { osVersionWidget } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.definition';
import { serialActiveWidget } from 'app/pages/dashboard/widgets/system/widget-serial-active/widget-serial-active.definition';
import { serialPassiveWidget } from 'app/pages/dashboard/widgets/system/widget-serial-passive/widget-serial-passive.definition';
import { systemInfoActiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.definition';
import { systemInfoPassiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.definition';
import { systemImageWidget } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.definition';
import { systemUptimeWidget } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.definition';

export const widgetTypeLabels = new Map<WidgetType, string>([
  [WidgetType.Ipv4Address, ipv4AddressWidget.name],
  [WidgetType.Ipv6Address, ipv6AddressWidget.name],
  [WidgetType.Help, helpWidget.name],
  [WidgetType.Memory, memoryWidget.name],
  [WidgetType.Interface, interfaceWidget.name],
  [WidgetType.BackupTasks, backupTasksWidget.name],
  [WidgetType.Cpu, cpuWidget.name],
  [WidgetType.CpuUsageGauge, cpuUsageGaugeWidget.name],
  [WidgetType.CpuUsageRecent, cpuUsageRecentWidget.name],
  [WidgetType.CpuUsageBar, cpuUsageBarWidget.name],
  [WidgetType.CpuTemperatureBar, cpuTemperatureBarWidget.name],
  [WidgetType.Storage, storageWidget.name],
  [WidgetType.SystemInfoActive, systemInfoActiveWidget.name],
  [WidgetType.SystemInfoPassive, systemInfoPassiveWidget.name],
  [WidgetType.HostnameActive, hostnameActiveWidget.name],
  [WidgetType.HostnamePassive, hostnamePassiveWidget.name],
  [WidgetType.OsVersion, osVersionWidget.name],
  [WidgetType.SystemUptime, systemUptimeWidget.name],
  [WidgetType.SystemImage, systemImageWidget.name],
  [WidgetType.Pool, poolWidget.name],
  [WidgetType.PoolUsageGauge, poolUsageGaugeWidget.name],
  [WidgetType.PoolStatus, poolStatusWidget.name],
  [WidgetType.PoolDisksWithZfsErrors, poolDisksWithZfsErrorsWidget.name],
  [WidgetType.PoolLastScanErrors, poolLastScanErrorsWidget.name],
  [WidgetType.ArbitraryText, arbitraryTextWidget.name],
  [WidgetType.SerialActive, serialActiveWidget.name],
  [WidgetType.SerialPassive, serialPassiveWidget.name],
  [WidgetType.CpuModelWidget, cpuModelWidget.name],
]);
