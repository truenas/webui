import { Widget } from 'app/pages/dashboard/types/widget.interface';

export enum WidgetGroupLayout {
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
