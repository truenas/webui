import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuUsageBarComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-bar/widget-cpu-usage-bar.component';

export const cpuUsageBarWidget = dashboardWidget({
  name: T('CPU Usage Per Core'),
  supportedSizes: [SlotSize.Half],
  category: WidgetCategory.Cpu,
  component: WidgetCpuUsageBarComponent,
  settingsComponent: null,
});
