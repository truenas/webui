import { Widget } from 'app/pages/dashboard/types/widget.interface';

export enum WidgetGroupLayout {
  /**
   * [  1  ]
   */
  Full = 'full',

  /**
   * [1][2]
   * [3][4]
   */
  Quarters = 'quarters',

  /**
   * [  1  ]
   * [2] [3]
   */
  HalfAndQuarters = 'half-and-quarters',

  /**
   * [1] [2]
   * [  3  ]
   */
  QuartersAndHalf = 'quarters-and-half',

  /**
   * [  1  ]
   * [  2  ]
   */
  Halves = 'halves',
}

export interface WidgetGroup {
  layout: WidgetGroupLayout;
  slots: [
    Widget | null,
    Widget | null,
    Widget | null,
    Widget | null,
  ];
}

export const widgetGroupIcons = new Map<WidgetGroupLayout, string>([
  [WidgetGroupLayout.Full, 'ix:layout_full'],
  [WidgetGroupLayout.Quarters, 'ix:layout_quarters'],
  [WidgetGroupLayout.Halves, 'ix:layout_halves'],
  [WidgetGroupLayout.HalfAndQuarters, 'ix:layout_half_and_quarters'],
  [WidgetGroupLayout.QuartersAndHalf, 'ix:layout_quarters_and_half'],
]);
