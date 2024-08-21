import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';

export const defaultWidgets: WidgetGroup[] = [
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.SystemInfoActive },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Help },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Cpu },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Memory },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Storage },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Interface },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.BackupTasks },
    ],
  },
];
