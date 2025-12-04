import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import uniqBy from 'lodash-es/uniqBy';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { mapLoadedValue } from 'app/modules/loader/directives/with-loading-state/map-loaded-value.utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-widget-interface-ip',
  templateUrl: './widget-interface-ip.component.html',
  styleUrls: ['./widget-interface-ip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetInterfaceIpComponent implements WidgetComponent<WidgetInterfaceIpSettings> {
  private resources = inject(WidgetResourcesService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  size = input.required<SlotSize>();
  settings = input.required<WidgetInterfaceIpSettings>();

  protected isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));

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

    return mapLoadedValue(this.interfaces(), (interfaces) => this.getIpAddresses(interfaces, interfaceId));
  });

  private interfaces = toSignal(this.resources.networkInterfaces$);

  private getIpAddresses(interfaces: NetworkInterface[], interfaceId: string): string {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return this.translate.instant('Network interface {interface} not found.', { interface: interfaceId });
    }

    const interfaceType = this.interfaceType();

    // Get all aliases from state
    const stateAliases = networkInterface?.state?.aliases.filter((alias) => alias.type === interfaceType) || [];

    // For HA systems, show IPs with labels
    if (this.isHaLicensed()) {
      const ipLines: string[] = [];

      // 1. Virtual IPs (VIPs) from failover_virtual_aliases
      const virtualAliases = networkInterface.failover_virtual_aliases?.filter(
        (alias) => alias.type === interfaceType,
      ) || [];
      virtualAliases.forEach((alias) => {
        ipLines.push(`${alias.address} ${this.translate.instant('(VIP)')}`);
      });

      // 2. Failover aliases (controller-specific IPs)
      const failoverAliases = networkInterface.failover_aliases?.filter(
        (alias) => alias.type === interfaceType,
      ) || [];
      failoverAliases.forEach((alias) => {
        ipLines.push(`${alias.address} ${this.translate.instant('(This Controller)')}`);
      });

      // 3. Regular aliases (if any that aren't already shown)
      const regularAliases = networkInterface.aliases?.filter(
        (alias) => alias.type === interfaceType,
      ) || [];
      const shownAddresses = new Set([
        ...virtualAliases.map((a) => a.address),
        ...failoverAliases.map((a) => a.address),
      ]);
      regularAliases.forEach((alias) => {
        if (!shownAddresses.has(alias.address)) {
          ipLines.push(alias.address);
        }
      });

      // If no HA-specific IPs, fall back to state aliases
      if (ipLines.length === 0 && stateAliases.length > 0) {
        return uniqBy(stateAliases, 'address').map((alias) => alias.address).join('\n');
      }

      return ipLines.length > 0 ? ipLines.join('\n') : this.translate.instant('N/A');
    }

    // Non-HA systems: show IPs as before
    if (!stateAliases?.length) {
      return this.translate.instant('N/A');
    }

    return uniqBy(stateAliases, 'address').map((alias) => alias.address).join('\n');
  }
}
