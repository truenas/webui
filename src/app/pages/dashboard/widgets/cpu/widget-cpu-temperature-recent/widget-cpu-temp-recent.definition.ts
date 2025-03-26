import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuTempRecentComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-recent/widget-cpu-temp-recent.component';

export const cpuTemperatureRecentWidget = dashboardWidget({
  name: T('CPU Recent Temperature'),
  supportedSizes: [SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.Cpu,
  component: WidgetCpuTempRecentComponent,
});
