import {
  Component, ChangeDetectionStrategy, input,
  computed,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, switchMap, map,
  tap,
  throttleTime,
} from 'rxjs';
import { kb } from 'app/constants/bits.constant';
import { oneHourMillis, oneMinuteMillis } from 'app/constants/time.constant';
import { LinkState, NetworkInterfaceAliasType, linkStateLabelMap } from 'app/enums/network-interface.enum';
import { BaseNetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { mapLoadedValue } from 'app/modules/loader/directives/with-loading-state/map-loaded-value.utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { fullSizeNetworkWidgetAspectRatio, halfSizeNetworkWidgetAspectRatio } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.const';
import { getNetworkInterface } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.utils';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-interface',
  templateUrl: './widget-interface.component.html',
  styleUrls: ['./widget-interface.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatIconButton,
    TestDirective,
    MatTooltip,
    RouterLink,
    IxIconComponent,
    WithLoadingStateDirective,
    NgxSkeletonLoaderModule,
    InterfaceStatusIconComponent,
    NetworkChartComponent,
    TranslateModule,
    NetworkSpeedPipe,
  ],
})
export class WidgetInterfaceComponent implements WidgetComponent<WidgetInterfaceIpSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetInterfaceIpSettings>();
  private interfaces = toSignal(this.resources.networkInterfaces$, { initialValue: { isLoading: true } });
  protected interfaceId = computed(() => this.settings()?.interface || '');
  protected interface = computed(() => mapLoadedValue(
    this.interfaces(),
    (interfaces) => getNetworkInterface(interfaces, this.interfaceId()),
  ));

  protected interfaceUsage = toSignal(toObservable(this.interface).pipe(
    filter((state) => Boolean(!state.isLoading && state.value)),
    map((state) => state.value.name),
    switchMap((interfaceId) => this.resources.realtimeUpdates$.pipe(
      throttleTime(1000),
      map((update) => update.fields.interfaces[interfaceId]),
    )),
    tap((realtimeUpdate) => {
      this.cachedNetworkStats.update((cachedStats) => {
        return [
          ...cachedStats,
          [
            realtimeUpdate.received_bytes_rate * 8,
            realtimeUpdate.sent_bytes_rate * 8,
          ],
        ].slice(-3600);
      });
    }),
  ));

  protected linkState = computed(() => {
    return this.interfaceUsage() ? this.interfaceUsage().link_state : this.interface().value.state.link_state;
  });

  protected isLinkStateUp = computed(() => this.linkState() === LinkState.Up);
  protected linkStateLabel = computed(() => linkStateLabelMap.get(this.linkState()));
  protected bitsIn = computed(() => this.interfaceUsage().received_bytes_rate * 8);
  protected bitsOut = computed(() => this.interfaceUsage().sent_bytes_rate * 8);

  protected showChart = computed(() => [SlotSize.Full, SlotSize.Half].includes(this.size()));
  protected isFullSize = computed(() => this.size() === SlotSize.Full);
  protected aspectRatio = computed(() => {
    return this.isFullSize() ? fullSizeNetworkWidgetAspectRatio : halfSizeNetworkWidgetAspectRatio;
  });

  protected isLoading = computed(() => {
    return this.interface().isLoading || !this.initialNetworkStats() || !this.interfaceUsage() || !this.networkStats();
  });

  protected initialNetworkStats = toSignal(toObservable(this.interface).pipe(
    filter((state) => Boolean(!state.isLoading && state.value)),
    map((state) => state.value.name),
    switchMap((interfaceId) => this.resources.networkInterfaceLastHourStats(interfaceId)),
    filter((response) => !!response.length),
    map((response) => {
      const [update] = response;
      return (update.data as number[][]).map((row) => row.slice(1).map((value) => value * kb));
    }),
  ));

  protected cachedNetworkStats = signal<number[][]>([]);
  protected networkStats = computed(() => {
    const cachedStats = this.cachedNetworkStats();
    const initialStats = this.initialNetworkStats();
    return [...initialStats, ...cachedStats].slice(-3600);
  });

  protected chartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const response = this.networkStats();
    const networkInterfaceName = this.interface().value.name;
    const startDate = Date.now() - oneHourMillis - oneMinuteMillis;
    const labels = response.map((_, index) => (startDate + index * 1000));

    return {
      datasets: [
        {
          label: this.translate.instant('Incoming [{networkInterfaceName}]', { networkInterfaceName }),
          data: response.map((item, index) => ({ x: labels[index], y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: this.translate.instant('Outgoing [{networkInterfaceName}]', { networkInterfaceName }),
          data: response.map((item, index) => ({ x: labels[index], y: -item[1] })),
          borderColor: currentTheme.orange,
          backgroundColor: currentTheme.orange,
          pointBackgroundColor: currentTheme.orange,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
      ],
    };
  });

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private theme: ThemeService,
  ) {}

  getIpAddress(nic: BaseNetworkInterface): string {
    let ip = '–';
    if (nic.state.aliases) {
      const addresses = nic.state.aliases.filter((item: NetworkInterfaceAlias) => {
        return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type);
      });

      if (addresses.length > 0) {
        ip = `${addresses[0].address}/${addresses[0].netmask}`;

        if (addresses.length >= 2) {
          ip += ` (+${addresses.length - 1})`; /* show that interface has additional addresses */
        }
      }
    }

    return ip;
  }
}
