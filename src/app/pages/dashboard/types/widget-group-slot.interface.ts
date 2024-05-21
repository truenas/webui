import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';

export interface WidgetGroupSlot<Settings> {
  slotSize: SlotSize;
  slotPosition: SlotPosition;
  type: WidgetType;
  settings: Settings;
}
