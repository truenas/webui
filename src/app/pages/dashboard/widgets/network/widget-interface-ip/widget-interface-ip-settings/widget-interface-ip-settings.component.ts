import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

@Component({
  selector: 'ix-widget-interface-ip-settings',
  templateUrl: './widget-interface-ip-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetInterfaceIpSettingsComponent implements WidgetSettingsComponent<WidgetInterfaceIpSettings> {
  something: WidgetInterfaceIpSettings;
}
