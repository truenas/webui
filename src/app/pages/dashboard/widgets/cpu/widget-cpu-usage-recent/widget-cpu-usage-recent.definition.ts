import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuUsageRecentComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-recent/widget-cpu-usage-recent.component';

export const cpuUsageRecentWidget = dashboardWidget({
  name: T('CPU Recent Usage'),
  supportedSizes: [SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.Cpu,
  component: WidgetCpuUsageRecentComponent,
  settingsComponent: null,
});
