/**
 * Note!
 * Before editing or removing a WidgetType,
 * consider users who may already have this widget type in their user attributes.
 *
 * Provide migration if possible.
 */
export enum WidgetType {
  Hostname = 'hostname',
  InterfaceIp = 'interface-ip',
  Help = 'help',
  Memory = 'memory',
  Cpu = 'cpu',
}

export enum SlotSize {
  Full = 'full',
  Half = 'half',
  Quarter = 'quarter',
}

export interface Widget {
  type: WidgetType;
  settings?: SomeWidgetSettings;
}

export type SomeWidgetSettings = object;
