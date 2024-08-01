import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetInterfaceComponent } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.component';
import { WidgetInterfaceIpSettingsComponent } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

export const interfaceWidget = dashboardWidget<WidgetInterfaceIpSettings>({
  name: T('Interface'),
  component: WidgetInterfaceComponent,
  category: WidgetCategory.Network,
  settingsComponent: WidgetInterfaceIpSettingsComponent,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
