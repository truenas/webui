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
import { ByteChartComponent } from 'app/pages/dashboard/widgets/network/common/byte-chart/byte-chart.component';

@Component({
  selector: 'ix-app-network-info',
  templateUrl: './app-network-info.component.html',
  styleUrls: ['./app-network-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    WithLoadingStateDirective,
    NgxSkeletonLoaderModule,
    ByteChartComponent,
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

  // Network traffic: API returns rx_bytes and tx_bytes as rates (bytes per second)
  readonly incomingTrafficBytes = computed(() => {
    const stats = this.cachedNetworkStats();
    // Return the most recent rate in bytes/s if available
    const [rx = 0] = stats.at(-1) || [];
    return rx;
  });

  readonly outgoingTrafficBytes = computed(() => {
    const stats = this.cachedNetworkStats();
    // Return the most recent rate in bytes/s if available
    const [, tx = 0] = stats.at(-1) || [];
    return tx;
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
      const statsValue = this.stats();
      // Silently ignore errors or loading states
      if (!statsValue || statsValue.isLoading || statsValue.error) {
        return;
      }

      const networkStats = statsValue.value?.networks;
      if (!networkStats || !Array.isArray(networkStats)) {
        return;
      }

      try {
        // API provides rx_bytes and tx_bytes as rates (bytes per second) - sum all network interfaces
        const currentRx = networkStats.reduce((sum, stats) => sum + (stats.rx_bytes ?? 0), 0);
        const currentTx = networkStats.reduce((sum, stats) => sum + (stats.tx_bytes ?? 0), 0);

        // Validate values are numbers
        if (typeof currentRx !== 'number' || typeof currentTx !== 'number' || Number.isNaN(currentRx) || Number.isNaN(currentTx)) {
          return;
        }

        // Use values directly as rates (bytes/s) - no delta calculation needed
        if (Number.isFinite(currentRx) && Number.isFinite(currentTx)) {
          this.cachedNetworkStats.update((cachedStats) => {
            return [...cachedStats, [currentRx, currentTx]].slice(-this.numberOfPoints);
          });
        }
      } catch {
        // Silently ignore calculation errors
      }
    });
  }
}
