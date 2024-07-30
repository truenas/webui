import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  dashboardWidget,
} from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHostnameActiveComponent } from 'app/pages/dashboard/widgets/system/widget-hostname-active/widget-hostname-active.component';

export const hostnameActiveWidget = dashboardWidget({
  name: T('Hostname – Active'),
  supportedSizes: [SlotSize.Quarter, SlotSize.Half, SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetHostnameActiveComponent,
  settingsComponent: null,
});
