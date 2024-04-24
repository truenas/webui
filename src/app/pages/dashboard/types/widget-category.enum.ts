import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum WidgetCategory {
  Network = 'network',
  Help = 'help',
  Cpu = 'cpu',
  Memory = 'memory',
  Storage = 'storage',
  BackupTasks = 'backup-tasks',
}

export const widgetCategoryLabels = new Map<WidgetCategory, string>([
  [WidgetCategory.Network, T('Network')],
  [WidgetCategory.Help, T('Help')],
  [WidgetCategory.Cpu, T('CPU')],
  [WidgetCategory.Cpu, T('Memory')],
  [WidgetCategory.Storage, T('Storage')],
  [WidgetCategory.BackupTasks, T('Backup Tasks')],
]);
