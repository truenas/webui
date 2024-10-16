import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { appWidget } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { appCpuWidget } from 'app/pages/dashboard/widgets/apps/widget-app-cpu/widget-app-cpu.definition';
import { appInfoWidget } from 'app/pages/dashboard/widgets/apps/widget-app-info/widget-app-info.definition';
import { appMemoryWidget } from 'app/pages/dashboard/widgets/apps/widget-app-memory/widget-app-memory.definition';
import { appNetworkWidget } from 'app/pages/dashboard/widgets/apps/widget-app-network/widget-app-network.definition';
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
import {
  hostnamePassiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-hostname-passive/widget-hostname-passive.definition';
import { osVersionWidget } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.definition';
import {
  serialActiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-serial-active/widget-serial-active.definition';
import {
  serialPassiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-serial-passive/widget-serial-passive.definition';
import { systemInfoActiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.definition';
import { systemInfoPassiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.definition';
import { systemImageWidget } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.definition';
import { systemUptimeWidget } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.definition';

export const widgetRegistry = {
  [WidgetType.App]: appWidget,
  [WidgetType.AppCpu]: appCpuWidget,
  [WidgetType.AppMemory]: appMemoryWidget,
  [WidgetType.AppNetwork]: appNetworkWidget,
  [WidgetType.AppInfo]: appInfoWidget,
  [WidgetType.Pool]: poolWidget,
  [WidgetType.PoolUsageGauge]: poolUsageGaugeWidget,
  [WidgetType.PoolStatus]: poolStatusWidget,
  [WidgetType.PoolDisksWithZfsErrors]: poolDisksWithZfsErrorsWidget,
  [WidgetType.PoolLastScanErrors]: poolLastScanErrorsWidget,
  [WidgetType.Ipv4Address]: ipv4AddressWidget,
  [WidgetType.Ipv6Address]: ipv6AddressWidget,
  [WidgetType.Help]: helpWidget,
  [WidgetType.Memory]: memoryWidget,
  [WidgetType.Interface]: interfaceWidget,
  [WidgetType.BackupTasks]: backupTasksWidget,
  [WidgetType.Cpu]: cpuWidget,
  [WidgetType.CpuUsageGauge]: cpuUsageGaugeWidget,
  [WidgetType.CpuUsageRecent]: cpuUsageRecentWidget,
  [WidgetType.CpuUsageBar]: cpuUsageBarWidget,
  [WidgetType.CpuTemperatureBar]: cpuTemperatureBarWidget,
  [WidgetType.Storage]: storageWidget,
  [WidgetType.SystemInfoActive]: systemInfoActiveWidget,
  [WidgetType.SystemInfoPassive]: systemInfoPassiveWidget,
  [WidgetType.OsVersion]: osVersionWidget,
  [WidgetType.SystemUptime]: systemUptimeWidget,
  [WidgetType.SystemImage]: systemImageWidget,
  [WidgetType.ArbitraryText]: arbitraryTextWidget,
  [WidgetType.HostnameActive]: hostnameActiveWidget,
  [WidgetType.HostnamePassive]: hostnamePassiveWidget,
  [WidgetType.SerialActive]: serialActiveWidget,
  [WidgetType.SerialPassive]: serialPassiveWidget,
  [WidgetType.CpuModelWidget]: cpuModelWidget,
};
