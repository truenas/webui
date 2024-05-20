import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum WidgetCategory {
  Empty = 'empty',
  Network = 'network',
  Help = 'help',
  Cpu = 'cpu',
  Memory = 'memory',
  Storage = 'storage',
  SystemInfo = 'system-information',
  BackupTasks = 'backup-tasks',
}

export const widgetCategoryLabels = new Map<WidgetCategory, string>([
  [WidgetCategory.Empty, T('Empty')],
  [WidgetCategory.Network, T('Network')],
  [WidgetCategory.Help, T('Help')],
  [WidgetCategory.Cpu, T('CPU')],
  [WidgetCategory.Memory, T('Memory')],
  [WidgetCategory.Storage, T('Storage')],
  [WidgetCategory.SystemInfo, T('System Information')],
  [WidgetCategory.BackupTasks, T('Backup Tasks')],
]);
