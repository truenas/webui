import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoActiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.component';

export const systemInfoActiveWidget = dashboardWidget({
  name: T('System Information – Active'),
  supportedSizes: [SlotSize.Full, SlotSize.Half],
  category: WidgetCategory.SystemInfo,
  component: WidgetSysInfoActiveComponent,
  settingsComponent: null,
});
