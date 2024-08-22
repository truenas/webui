import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuTemperatureBarComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.component';

export const cpuTemperatureBarWidget = dashboardWidget({
  name: T('CPU Temperature Per Core'),
  supportedSizes: [SlotSize.Half],
  category: WidgetCategory.Cpu,
  component: WidgetCpuTemperatureBarComponent,
  settingsComponent: null,
});
