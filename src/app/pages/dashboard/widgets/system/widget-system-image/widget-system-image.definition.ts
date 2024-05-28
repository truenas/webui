import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSystemImageComponent } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.component';

export const systemImageWidget = dashboardWidget({
  name: T('System Image'),
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.SystemInfo,
  component: WidgetSystemImageComponent,
  settingsComponent: null,
});
