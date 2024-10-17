import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

@Component({
  selector: 'ix-widget-interface-ip',
  templateUrl: './widget-interface-ip.component.html',
  styleUrls: ['./widget-interface-ip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
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

    return mapLoadedValue(this.interfaces(), (interfaces) => this.getIpAddresses(interfaces, interfaceId));
  });

  private interfaces = toSignal(this.resources.networkInterfaces$);

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
  ) {}

  private getIpAddresses(interfaces: NetworkInterface[], interfaceId: string): string {
    const networkInterface = interfaces.find((nic) => nic.name === interfaceId);

    if (!networkInterface) {
      return this.translate.instant('Network interface {interface} not found.', { interface: interfaceId });
    }

    const ipAliases = networkInterface?.state?.aliases.filter((alias) => alias.type === this.interfaceType());

    if (!ipAliases?.length) {
      return this.translate.instant('N/A');
    }

    return uniqBy(ipAliases, 'address').map((alias) => alias.address).join('\n');
  }
}
