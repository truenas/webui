import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { mapLoadedValue } from 'app/modules/loader/directives/with-loading-state/map-loaded-value.utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

@Component({
  selector: 'ix-widget-interface-ip',
  templateUrl: './widget-interface-ip.component.html',
  styleUrls: ['./widget-interface-ip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetInterfaceIpComponent implements WidgetComponent<WidgetInterfaceIpSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetInterfaceIpSettings>();

  protected interfaceId = computed(() => {
    if (this.settings()?.interface) {
      return this.settings().interface;
    }
    return mapLoadedValue(this.interfaces(), (nics) => nics[0].name)?.value;
  });
  protected interfaceType = computed(() => {
    return this.settings()?.widgetName?.includes('v6') ? NetworkInterfaceAliasType.Inet6 : NetworkInterfaceAliasType.Inet;
  });

  protected widgetName = computed(() => {
    return this.translate.instant('{nic} Address', { nic: this.interfaceId() }) || '';
  });

  protected ips = computed(() => {
    const interfaceId = this.interfaceId();

    return mapLoadedValue(this.interfaces(), (interfaces) => this.getIp4Addresses(interfaces, interfaceId));
  });

  private interfaces = toSignal(this.resources.networkInterfaces$);

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
  ) {}

  private getIp4Addresses(interfaces: NetworkInterface[], interfaceId: string): string {
    // TODO: Show widget error if interfaceId is empty
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      // TODO: Show as widget error.
      return this.translate.instant('Network interface {interface} not found.', { interface: interfaceId });
    }

    let networkInterfaceAlias = networkInterface.aliases;
    if (!networkInterfaceAlias.length && networkInterface?.state?.aliases?.length) {
      networkInterfaceAlias = networkInterface.state.aliases;
    }

    const ipAliases = networkInterfaceAlias.filter((alias) => alias.type === this.interfaceType());

    if (!ipAliases.length) {
      return this.translate.instant('N/A');
    }

    return ipAliases.map((alias) => alias.address).join('\n');
  }
}
