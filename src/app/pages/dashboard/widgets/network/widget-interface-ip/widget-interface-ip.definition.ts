import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetInterfaceIpSettingsComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import {
  WidgetInterfaceIpComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.component';

export interface WidgetInterfaceIpSettings {
  interface: string;
  widgetName?: string;
}

export const ipv4AddressWidget = dashboardWidget<WidgetInterfaceIpSettings>({
  name: T('IPv4 Address'),
  component: WidgetInterfaceIpComponent,
  category: WidgetCategory.Network,
  settingsComponent: WidgetInterfaceIpSettingsComponent,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});

export const ipv6AddressWidget = dashboardWidget<WidgetInterfaceIpSettings>({
  name: T('IPv6 Address'),
  component: WidgetInterfaceIpComponent,
  category: WidgetCategory.Network,
  settingsComponent: WidgetInterfaceIpSettingsComponent,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
});
