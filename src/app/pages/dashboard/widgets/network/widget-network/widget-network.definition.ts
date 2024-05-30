import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetInterfaceIpSettingsComponent } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.component';

export const networkWidget = dashboardWidget({
  name: T('Network'),
  component: WidgetNetworkComponent,
  category: WidgetCategory.Network,
  settingsComponent: WidgetInterfaceIpSettingsComponent as Type<WidgetSettingsComponent>,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
