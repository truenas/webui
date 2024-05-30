import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHelpComponent } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.component';

export const helpWidget = dashboardWidget({
  name: T('Help'),
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
  category: WidgetCategory.Help,
  component: WidgetHelpComponent,
  settingsComponent: null,
});
