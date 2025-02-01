import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuTempComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature/widget-cpu-temp.component';

export const cpuTempWidget = dashboardWidget({
  name: T('CPU Temp'),
  component: WidgetCpuTempComponent,
  category: WidgetCategory.Cpu,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
