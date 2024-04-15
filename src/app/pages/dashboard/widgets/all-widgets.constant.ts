import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { helpWidget } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.definition';
import { hostnameWidget } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.definition';
import {
  interfaceIpWidget,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

export const widgetComponents = [
  hostnameWidget.component,
  interfaceIpWidget.component,
  interfaceIpWidget.settingsComponent,
  helpWidget.component,
];

export const widgetRegistry = {
  [WidgetType.Hostname]: hostnameWidget,
  [WidgetType.InterfaceIp]: interfaceIpWidget,
  [WidgetType.Help]: helpWidget,
};
