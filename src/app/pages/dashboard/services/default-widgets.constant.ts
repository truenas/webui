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
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.CpuModelWidget },
      { type: WidgetType.CpuUsageBar },
    ],
  },
  {
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.CpuUsageRecent },
      { type: WidgetType.CpuTemperatureBar },
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
      { type: WidgetType.BackupTasks },
    ],
  },
  {
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.Ipv4Address },
      { type: WidgetType.Interface },
    ],
  },
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Help },
    ],
  },
];
