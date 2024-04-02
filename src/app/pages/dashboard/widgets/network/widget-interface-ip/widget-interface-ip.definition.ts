import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { dashboardWidget, WidgetDefinition } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetInterfaceIpSettingsComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import {
  WidgetInterfaceIpComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.component';

export interface WidgetInterfaceIpSettings {
  interface: string;
}

export const interfaceIpWidget = dashboardWidget<WidgetInterfaceIpSettings>({
  name: T('IPv4 Datapoint'),
  component: WidgetInterfaceIpComponent,
  category: WidgetCategory.Network,
  settingsComponent: WidgetInterfaceIpSettingsComponent,
  supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
} as WidgetDefinition<WidgetInterfaceIpSettings, WidgetInterfaceIpComponent, WidgetInterfaceIpSettingsComponent>);
