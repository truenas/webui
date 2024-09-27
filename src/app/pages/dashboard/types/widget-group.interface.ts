import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
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

export const widgetGroupIcons = [
  {
    value: WidgetGroupLayout.Full,
    icon: 'ix:layout-full',
    label: T('One large widget'),
  },
  {
    value: WidgetGroupLayout.Halves,
    icon: 'ix:layout-halves',
    label: T('Two half widgets, one below another'),
  },
  {
    value: WidgetGroupLayout.QuartersAndHalf,
    icon: 'ix:layout-quarters_and_half',
    label: T('Two quarter widgets and one half widget below'),
  },
  {
    value: WidgetGroupLayout.HalfAndQuarters,
    icon: 'ix:layout-half_and_quarters',
    label: T('One half widget and two quarter widgets below'),
  },
  {
    value: WidgetGroupLayout.Quarters,
    icon: 'ix:layout-quarters',
    label: T('Four quarter widgets in two by two grid'),
  },
];
