import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { hostnameWidget } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.definition';
import {
  interfaceIpWidget,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

export const widgetComponents = [
  hostnameWidget.component,
  interfaceIpWidget.component,
  interfaceIpWidget.settingsComponent,
];

export const widgetRegistry = {
  [WidgetType.Hostname]: hostnameWidget,
  [WidgetType.InterfaceIp]: interfaceIpWidget,
};
