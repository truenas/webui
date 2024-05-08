import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoLocalComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-local/widget-sys-info-local.component';

export const systemInfoActiveWidget = dashboardWidget({
  name: T('System Information'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSysInfoLocalComponent,
  settingsComponent: null,
});

export const systemInfoPassiveWidget = dashboardWidget({
  name: T('System Information'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSysInfoLocalComponent,
  settingsComponent: null,
});
