import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.component';

export const cpuWidget = dashboardWidget({
  name: T('CPU Overview'),
  supportedSizes: [SlotSize.Full],
  category: WidgetCategory.Cpu,
  component: WidgetCpuComponent,
  settingsComponent: null,
});
