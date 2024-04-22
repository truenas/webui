import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetMemoryComponent } from 'app/pages/dashboard/widgets/memory/widget-memory/widget-memory.component';

export const memoryWidget = dashboardWidget({
  name: T('Memory'),
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.Memory,
  component: WidgetMemoryComponent,
  settingsComponent: null,
});
