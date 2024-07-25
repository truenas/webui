import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetSerialActiveComponent,
} from 'app/pages/dashboard/widgets/system/widget-serial-active/widget-serial-active.component';

export const serialActiveWidget = dashboardWidget({
  name: T('Serial – Active'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSerialActiveComponent,
  settingsComponent: null,
});
