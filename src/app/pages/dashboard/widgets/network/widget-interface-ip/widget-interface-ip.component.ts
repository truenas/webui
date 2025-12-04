import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
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

interface IpAddressData {
  address: string;
  label?: string;
}

interface CategorizedIpAddresses {
  virtual: NetworkInterface['failover_virtual_aliases'];
  failover: NetworkInterface['failover_aliases'];
  other: NetworkInterface['state']['aliases'];
}

@Component({
  selector: 'ix-widget-interface-ip',
  templateUrl: './widget-interface-ip.component.html',
  styleUrls: ['./widget-interface-ip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
    MatCard,
    MatCardContent,
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

  protected ipAddressList = computed(() => {
    if (!this.isHaLicensed()) {
      return null;
    }

    const interfaceId = this.interfaceId();
    return mapLoadedValue(this.interfaces(), (interfaces) => this.getIpAddressList(interfaces, interfaceId));
  });

  private interfaces = toSignal(this.resources.networkInterfaces$);

  /**
   * Categorizes IP addresses into virtual IPs, failover IPs, and other controller IPs.
   * This shared logic prevents duplication between string and structured data formatters.
   */
  private categorizeIpAddresses(
    networkInterface: NetworkInterface | undefined,
    interfaceType: NetworkInterfaceAliasType,
  ): CategorizedIpAddresses {
    if (!networkInterface) {
      return { virtual: [], failover: [], other: [] };
    }

    const stateAliases = networkInterface.state?.aliases.filter((alias) => alias.type === interfaceType) || [];
    const virtualAliases = networkInterface.failover_virtual_aliases?.filter(
      (alias) => alias.type === interfaceType,
    ) || [];
    const failoverAliases = networkInterface.failover_aliases?.filter(
      (alias) => alias.type === interfaceType,
    ) || [];

    // Track which addresses are already labeled as virtual or failover
    const labeledAddresses = new Set([
      ...virtualAliases.map((a) => a.address),
      ...failoverAliases.map((a) => a.address),
    ]);

    // Remaining addresses from state that aren't virtual or failover
    const otherAliases = stateAliases.filter((alias) => !labeledAddresses.has(alias.address));

    return { virtual: virtualAliases, failover: failoverAliases, other: otherAliases };
  }

  private getIpAddresses(interfaces: NetworkInterface[], interfaceId: string): string {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return this.translate.instant('Network interface {interface} not found.', { interface: interfaceId });
    }

    const interfaceType = this.interfaceType();
    const stateAliases = networkInterface?.state?.aliases.filter((alias) => alias.type === interfaceType) || [];

    if (!stateAliases?.length) {
      return this.translate.instant('N/A');
    }

    return uniqBy(stateAliases, 'address').map((alias) => alias.address).join('\n');
  }

  private getIpAddressList(interfaces: NetworkInterface[], interfaceId: string): IpAddressData[] {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return [];
    }

    const interfaceType = this.interfaceType();
    const categorized = this.categorizeIpAddresses(networkInterface, interfaceType);
    const ipList: IpAddressData[] = [];

    // 1. Virtual IPs
    categorized.virtual.forEach((alias) => {
      ipList.push({ address: alias.address, label: `(${this.translate.instant('Virtual IP')})` });
    });

    // 2. This controller's IPs
    categorized.failover.forEach((alias) => {
      ipList.push({ address: alias.address, label: `(${this.translate.instant('This Controller')})` });
    });

    // 3. Other controller's IPs
    categorized.other.forEach((alias) => {
      ipList.push({ address: alias.address, label: `(${this.translate.instant('Other Controller')})` });
    });

    return ipList;
  }
}
