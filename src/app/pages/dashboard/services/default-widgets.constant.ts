import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { Widget, WidgetType } from 'app/pages/dashboard/types/widget.interface';

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
      { type: WidgetType.SystemInfoPassive },
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
      { type: WidgetType.Memory },
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
      { type: WidgetType.BackupTasks },
    ],
  },
  {
    layout: WidgetGroupLayout.QuartersAndHalf,
    slots: [
      { type: WidgetType.Memory },
      { type: WidgetType.Memory },
      { type: WidgetType.Memory },
      null,
    ],
  },
  {
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.HostnameActive },
      {
        type: WidgetType.Ipv4Address,
        settings: {
          interface: 'eno1',
        },
      },
    ],
  },
  {
    layout: WidgetGroupLayout.Quarters,
    slots: [
      {
        type: WidgetType.Ipv4Address,
        settings: {
          interface: 'notExistent',
        },
      },
      {
        type: 'broken',
      } as unknown as Widget,
      {
        // Incorrect size
        type: WidgetType.Help,
      },
    ],
  },
];
