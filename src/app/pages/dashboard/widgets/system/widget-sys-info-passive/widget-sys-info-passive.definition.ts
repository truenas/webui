import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoPassiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.component';

export const systemInfoPassiveWidget = dashboardWidget({
  name: T('System Information Standby'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.SystemInfo,
  component: WidgetSysInfoPassiveComponent,
  settingsComponent: null,
});
