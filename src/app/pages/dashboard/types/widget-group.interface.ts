import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { SlotSize, Widget } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

export enum WidgetGroupLayout {
  Full = 'full',

  /**
   * [0][1]
   * [2][3]
   */
  Quarters = 'quarters',

  /**
   * [  0  ]
   * [1] [2]
   */
  HalfAndQuarters = 'half-and-quarters',

  /**
   * [0] [1]
   * [  2  ]
   */
  QuartersAndHalf = 'quarters-and-half',

  /**
   * [  0  ]
   * [  1  ]
   */
  Halves = 'halves',
}

export interface WidgetGroup {
  layout: WidgetGroupLayout;
  slots: [
    (Widget | null)?,
    (Widget | null)?,
    (Widget | null)?,
    (Widget | null)?,
  ];
}

export interface FormWidgetGroup {
  layout: WidgetGroupLayout;
  slots: [
    (FormWidget | null)?,
    (FormWidget | null)?,
    (FormWidget | null)?,
    (FormWidget | null)?,
  ];
}

export function widgetGroupToFormWidgetGroup(widgetGroup: WidgetGroup): FormWidgetGroup {
  const group: FormWidgetGroup = { layout: widgetGroup.layout, slots: [] };
  for (const slot of widgetGroup.slots) {
    group.slots.push({ ...slot, category: widgetRegistry[slot.type].category });
  }
  return group;
}

export function formWidgetGroupToWidgetGroup(formWidgetGroup: FormWidgetGroup): WidgetGroup {
  const group: WidgetGroup = { layout: formWidgetGroup.layout, slots: [] };
  for (const slot of formWidgetGroup.slots) {
    const newSlot = { ...slot };
    delete newSlot.category;
    group.slots.push(newSlot);
  }
  return group;
}

export type FormWidget = Widget & { category: WidgetCategory };

export const layoutToSlotSizes = {
  [WidgetGroupLayout.Full]: [SlotSize.Full],
  [WidgetGroupLayout.Halves]: [SlotSize.Half, SlotSize.Half],
  [WidgetGroupLayout.QuartersAndHalf]: [SlotSize.Quarter, SlotSize.Quarter, SlotSize.Half],
  [WidgetGroupLayout.HalfAndQuarters]: [SlotSize.Half, SlotSize.Quarter, SlotSize.Quarter],
  [WidgetGroupLayout.Quarters]: [SlotSize.Quarter, SlotSize.Quarter, SlotSize.Quarter, SlotSize.Quarter],
};

export const widgetGroupIcons = new Map<WidgetGroupLayout, string>([
  [WidgetGroupLayout.Full, 'ix:layout_full'],
  [WidgetGroupLayout.Quarters, 'ix:layout_quarters'],
  [WidgetGroupLayout.Halves, 'ix:layout_halves'],
  [WidgetGroupLayout.HalfAndQuarters, 'ix:layout_half_and_quarters'],
  [WidgetGroupLayout.QuartersAndHalf, 'ix:layout_quarters_and_half'],
]);
