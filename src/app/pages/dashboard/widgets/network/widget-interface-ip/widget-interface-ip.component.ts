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
  private store$ = inject(Store<AppState>);

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

  // Memoized translated labels to avoid repeated translate.instant() calls
  private virtualIpLabel = computed(() => this.translate.instant('(Virtual IP)'));
  private thisControllerLabel = computed(() => this.translate.instant('(This Controller)'));
  private otherControllerLabel = computed(() => this.translate.instant('(Other Controller)'));

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
   * Filters aliases by the specified interface type (IPv4 or IPv6).
   */
  private filterAliasesByType(
    aliases: NetworkInterface['state']['aliases'] | undefined,
    interfaceType: NetworkInterfaceAliasType,
  ): NetworkInterface['state']['aliases'] {
    return aliases?.filter((alias) => alias.type === interfaceType) || [];
  }

  /**
   * Categorizes IP addresses into virtual IPs, failover IPs, and other controller IPs.
   * This shared logic prevents duplication between string and structured data formatters.
   *
   * Note: Virtual and failover IPs are sourced from their dedicated properties
   * (failover_virtual_aliases, failover_aliases) and will be displayed even if they're
   * not present in state.aliases. This is intentional for HA systems where failover
   * hasn't occurred yet but we still want to show the configured failover IPs.
   */
  private categorizeIpAddresses(
    networkInterface: NetworkInterface | undefined,
    interfaceType: NetworkInterfaceAliasType,
  ): CategorizedIpAddresses {
    if (!networkInterface) {
      return { virtual: [], failover: [], other: [] };
    }

    // Use defensive optional chaining for all alias properties even though they're typed as required
    // This provides better runtime safety if API responses don't match type definitions
    const stateAliases = this.filterAliasesByType(networkInterface.state?.aliases, interfaceType);
    // Virtual and failover aliases come from dedicated properties, not state.aliases
    // This ensures they're displayed even if not currently active in state
    const virtualAliases = this.filterAliasesByType(networkInterface.failover_virtual_aliases, interfaceType);
    const failoverAliases = this.filterAliasesByType(networkInterface.failover_aliases, interfaceType);

    // Track which addresses are already labeled as virtual or failover
    const labeledAddresses = new Set([
      ...virtualAliases.map((a) => a.address),
      ...failoverAliases.map((a) => a.address),
    ]);

    // Remaining addresses from state that aren't virtual or failover
    // In HA systems, these are typically IPs from the other controller that appear in this
    // controller's state.aliases but aren't in failover_aliases or failover_virtual_aliases
    const otherAliases = stateAliases.filter((alias) => !labeledAddresses.has(alias.address));

    return { virtual: virtualAliases, failover: failoverAliases, other: otherAliases };
  }

  /**
   * Gets IP addresses as a formatted string for non-HA mode display.
   * Returns error messages for missing interfaces or empty results.
   */
  private getIpAddresses(interfaces: NetworkInterface[], interfaceId: string): string {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return this.translate.instant('Network interface {interface} not found.', { interface: interfaceId });
    }

    const interfaceType = this.interfaceType();
    const stateAliases = this.filterAliasesByType(networkInterface.state?.aliases, interfaceType);

    if (!stateAliases.length) {
      return this.translate.instant('N/A');
    }

    return uniqBy(stateAliases, 'address').map((alias) => alias.address).join('\n');
  }

  /**
   * Gets IP addresses as structured data for HA mode list display.
   * Returns empty array for missing interfaces, allowing the template to render an empty list gracefully.
   */
  private getIpAddressList(interfaces: NetworkInterface[], interfaceId: string): IpAddressData[] {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return [];
    }

    const interfaceType = this.interfaceType();
    const categorized = this.categorizeIpAddresses(networkInterface, interfaceType);
    const ipList: IpAddressData[] = [];

    // 1. Virtual IPs
    const virtualLabel = this.virtualIpLabel();
    uniqBy(categorized.virtual, 'address').forEach((alias) => {
      ipList.push({ address: alias.address, label: virtualLabel });
    });

    // 2. This controller's IPs
    const thisControllerLabelValue = this.thisControllerLabel();
    uniqBy(categorized.failover, 'address').forEach((alias) => {
      ipList.push({ address: alias.address, label: thisControllerLabelValue });
    });

    // 3. Other controller's IPs (addresses in state but not in failover or virtual categories)
    const otherControllerLabelValue = this.otherControllerLabel();
    uniqBy(categorized.other, 'address').forEach((alias) => {
      ipList.push({ address: alias.address, label: otherControllerLabelValue });
    });

    return ipList;
  }
}
