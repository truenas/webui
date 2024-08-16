import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuModelComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-model/widget-cpu-model.component';

export const cpuModelWidget = dashboardWidget({
  name: T('CPU Model'),
  component: WidgetCpuModelComponent,
  category: WidgetCategory.Cpu,
  settingsComponent: null,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
