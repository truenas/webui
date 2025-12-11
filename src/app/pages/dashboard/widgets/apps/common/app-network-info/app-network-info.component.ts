import { Component, ChangeDetectionStrategy, input, computed, signal, effect, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { RateChartComponent } from 'app/pages/dashboard/widgets/network/common/rate-chart/rate-chart.component';

@Component({
  selector: 'ix-app-network-info',
  templateUrl: './app-network-info.component.html',
  styleUrls: ['./app-network-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    WithLoadingStateDirective,
    NgxSkeletonLoaderModule,
    RateChartComponent,
    TranslateModule,
    NetworkSpeedPipe,
  ],
})
export class AppNetworkInfoComponent {
  private theme = inject(ThemeService);
  private translate = inject(TranslateService);

  stats = input.required<LoadingState<AppStats>>();
  aspectRatio = input<number>(3);

  private numberOfPoints = 60;

  isLoading = computed(() => this.stats().isLoading);

  protected readonly initialNetworkStats = Array.from({ length: this.numberOfPoints }, () => [0, 0]);
  protected readonly cachedNetworkStats = signal<number[][]>([]);

  networkStats = computed(() => {
    const cachedStats = this.cachedNetworkStats();
    return [...this.initialNetworkStats, ...cachedStats].slice(-this.numberOfPoints);
  });

  readonly incomingTrafficBits = computed(() => {
    return (this.stats()?.value?.networks?.reduce((sum, stats) => sum + this.bytesToBits(stats.rx_bytes), 0) || 0);
  });

  readonly outgoingTrafficBits = computed(() => {
    return (this.stats()?.value?.networks?.reduce((sum, stats) => sum + this.bytesToBits(stats.tx_bytes), 0) || 0);
  });

  protected networkChartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const data = this.networkStats();
    const labels: number[] = data.map((_, index) => Date.now() - (this.numberOfPoints - 1 - index) * 1000);

    return {
      datasets: [
        {
          label: this.translate.instant('In'),
          data: data.map((item, index) => ({ x: labels[index], y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: this.translate.instant('Out'),
          data: data.map((item, index) => ({ x: labels[index], y: -item[1] })),
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

  constructor() {
    effect(() => {
      const networkStats = this.stats()?.value?.networks;
      const incomingTraffic = networkStats?.reduce((sum, stats) => sum + this.bytesToBits(stats.rx_bytes), 0);
      const outgoingTraffic = networkStats?.reduce((sum, stats) => sum + this.bytesToBits(stats.tx_bytes), 0);
      if (networkStats && incomingTraffic && outgoingTraffic) {
        this.cachedNetworkStats.update((cachedStats) => {
          return [...cachedStats, [incomingTraffic, outgoingTraffic]].slice(-this.numberOfPoints);
        });
      }
    });
  }

  private bytesToBits(bytes: number): number {
    if (bytes == null) {
      return 0;
    }
    return bytes * 8;
  }
}
