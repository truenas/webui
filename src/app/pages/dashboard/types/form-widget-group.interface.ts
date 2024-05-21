import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { Widget } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

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
