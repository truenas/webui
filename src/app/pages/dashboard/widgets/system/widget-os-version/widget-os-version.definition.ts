import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetOsVersionComponent } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.component';

export const osVersionWidget = dashboardWidget({
  name: T('OS Version'),
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.SystemInfo,
  component: WidgetOsVersionComponent,
  settingsComponent: null,
});
