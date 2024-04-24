import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetNetworkComponent } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.component';

export const networkWidget = dashboardWidget({
  name: T('Network'),
  component: WidgetNetworkComponent,
  category: WidgetCategory.Network,
  settingsComponent: null,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
