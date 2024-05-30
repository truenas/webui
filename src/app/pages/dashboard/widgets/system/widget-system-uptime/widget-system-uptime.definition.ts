import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSystemUptimeComponent } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.component';

export const systemUptimeWidget = dashboardWidget({
  name: T('System Uptime'),
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.SystemInfo,
  component: WidgetSystemUptimeComponent,
  settingsComponent: null,
});
