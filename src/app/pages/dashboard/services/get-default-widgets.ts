import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';

const defaultWidgets: WidgetGroup[] = [
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
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.CpuUsageBar },
      { type: WidgetType.CpuTemperatureBar },
    ],
  },
  {
    layout: WidgetGroupLayout.QuartersAndHalf,
    slots: [
      { type: WidgetType.CpuUsageGauge },
      { type: WidgetType.CpuModelWidget },
      { type: WidgetType.CpuUsageRecent },
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

export const getDefaultWidgets = (isHaLicensed?: boolean): WidgetGroup[] => {
  if (!isHaLicensed) {
    return defaultWidgets.filter(
      (widgetGroup) => !widgetGroup.slots.some((slot) => slot?.type === WidgetType.SystemInfoPassive),
    );
  }

  return defaultWidgets;
};
