import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { backupTasksWidget } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.definition';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { helpWidget } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.definition';
import { memoryWidget } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.definition';
import { hostnameWidget } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.definition';
import { ipv4AddressWidget, ipv6AddressWidget } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { networkWidget } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.definition';
import { systemInfoActiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.definition';
import { systemInfoPassiveWidget } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.definition';

export const widgetComponents = [
  hostnameWidget.component,
  ipv4AddressWidget.component,
  ipv4AddressWidget.settingsComponent,
  ipv6AddressWidget.component,
  ipv6AddressWidget.settingsComponent,
  helpWidget.component,
  memoryWidget.component,
  networkWidget.component,
  backupTasksWidget.component,
  cpuWidget.component,
  systemInfoActiveWidget.component,
  systemInfoPassiveWidget.component,
];

export const widgetRegistry = {
  [WidgetType.Hostname]: hostnameWidget,
  [WidgetType.Ipv4Address]: ipv4AddressWidget,
  [WidgetType.Ipv6Address]: ipv6AddressWidget,
  [WidgetType.Help]: helpWidget,
  [WidgetType.Memory]: memoryWidget,
  [WidgetType.Network]: networkWidget,
  [WidgetType.BackupTasks]: backupTasksWidget,
  [WidgetType.Cpu]: cpuWidget,
  [WidgetType.SystemInfoActive]: systemInfoActiveWidget,
  [WidgetType.SystemInfoPassive]: systemInfoPassiveWidget,
};
