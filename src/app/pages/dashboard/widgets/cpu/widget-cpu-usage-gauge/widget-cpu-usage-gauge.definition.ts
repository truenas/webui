import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuUsageGaugeComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.component';

export const cpuUsageGaugeWidget = dashboardWidget({
  name: T('CPU Usage'),
  supportedSizes: [SlotSize.Quarter],
  category: WidgetCategory.Cpu,
  component: WidgetCpuUsageGaugeComponent,
  settingsComponent: null,
});
