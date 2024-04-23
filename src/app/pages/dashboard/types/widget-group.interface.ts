import { SlotSize, Widget } from 'app/pages/dashboard/types/widget.interface';

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

export const layoutToSlotSizes = {
  [WidgetGroupLayout.Full]: [SlotSize.Full],
  [WidgetGroupLayout.Halves]: [SlotSize.Half, SlotSize.Half],
  [WidgetGroupLayout.QuartersAndHalf]: [SlotSize.Quarter, SlotSize.Quarter, SlotSize.Half],
  [WidgetGroupLayout.HalfAndQuarters]: [SlotSize.Half, SlotSize.Quarter, SlotSize.Quarter],
  [WidgetGroupLayout.Quarters]: [SlotSize.Quarter, SlotSize.Quarter, SlotSize.Quarter, SlotSize.Quarter],
};
