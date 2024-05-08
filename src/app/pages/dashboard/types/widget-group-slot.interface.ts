import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';

export interface WidgetGroupSlot<Settings> {
  slotSize: SlotSize;
  slotPosition: SlotPosition;
  category: WidgetCategory;
  type: WidgetType;
  settings: Settings;
}
