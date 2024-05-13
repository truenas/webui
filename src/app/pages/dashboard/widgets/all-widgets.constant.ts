import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { backupTasksWidget } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.definition';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { helpWidget } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.definition';
import { memoryWidget } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.definition';
import { hostnameWidget } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.definition';
import {
  interfaceIpWidget,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { networkWidget } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.definition';
import { storageWidget } from 'app/pages/dashboard/widgets/storage/widget-storage/widget-storage.definition';

export const widgetComponents = [
  hostnameWidget.component,
  interfaceIpWidget.component,
  interfaceIpWidget.settingsComponent,
  helpWidget.component,
  memoryWidget.component,
  networkWidget.component,
  backupTasksWidget.component,
  cpuWidget.component,
  storageWidget.component,
];

export const widgetRegistry = {
  [WidgetType.Hostname]: hostnameWidget,
  [WidgetType.InterfaceIp]: interfaceIpWidget,
  [WidgetType.Help]: helpWidget,
  [WidgetType.Memory]: memoryWidget,
  [WidgetType.Network]: networkWidget,
  [WidgetType.BackupTasks]: backupTasksWidget,
  [WidgetType.Cpu]: cpuWidget,
  [WidgetType.Storage]: storageWidget,
};
