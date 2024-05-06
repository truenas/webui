import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { Widget, WidgetType } from 'app/pages/dashboard/types/widget.interface';

export const demoWidgets: WidgetGroup[] = [
  {
    layout: WidgetGroupLayout.Full,
    slots: [
      { type: WidgetType.Help },
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
      { type: WidgetType.Hostname },
      {
        type: WidgetType.InterfaceIp,
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
        type: WidgetType.InterfaceIp,
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
