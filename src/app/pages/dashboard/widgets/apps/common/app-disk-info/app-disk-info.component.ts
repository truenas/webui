import { Component, ChangeDetectionStrategy, input, computed, effect, signal, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { ByteChartComponent } from 'app/pages/dashboard/widgets/network/common/byte-chart/byte-chart.component';

@Component({
  selector: 'ix-app-disk-info',
  templateUrl: './app-disk-info.component.html',
  styleUrls: ['./app-disk-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    WithLoadingStateDirective,
    NgxSkeletonLoaderModule,
    ByteChartComponent,
    TranslateModule,
    FileSizePipe,
  ],
})
export class AppDiskInfoComponent {
  private theme = inject(ThemeService);
  private translate = inject(TranslateService);

  stats = input.required<LoadingState<AppStats>>();
  aspectRatio = input<number>(3);

  private numberOfPoints = 60;

  isLoading = computed(() => this.stats().isLoading);
  protected readonly initialDiskStats = Array.from({ length: this.numberOfPoints }, () => [0, 0]);
  protected readonly cachedDiskStats = signal<number[][]>([]);
  readonly diskStats = computed(() => {
    const cachedStats = this.cachedDiskStats();
    return [...this.initialDiskStats, ...cachedStats].slice(-this.numberOfPoints);
  });

  // Block I/O: API returns blkio.read and blkio.write as cumulative bytes (not rates)
  // We calculate deltas to show how many bytes were read/written in each interval
  private previousStats: { read: number; write: number } | null = null;

  protected diskChartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const data = this.diskStats();
    const labels: number[] = data.map((_, index) => Date.now() - (this.numberOfPoints - 1 - index) * 1000);

    return {
      datasets: [
        {
          label: this.translate.instant('Read'),
          data: data.map((item, index) => ({ x: labels[index], y: item[0] })),
          borderColor: currentTheme.blue,
          backgroundColor: currentTheme.blue,
          pointBackgroundColor: currentTheme.blue,
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: this.translate.instant('Write'),
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

      const diskStats = statsValue.value?.blkio;
      if (!diskStats) {
        return;
      }

      // API returns cumulative bytes - validate values are numbers
      const currentRead = typeof diskStats.read === 'number' && !Number.isNaN(diskStats.read) ? diskStats.read : 0;
      const currentWrite = typeof diskStats.write === 'number' && !Number.isNaN(diskStats.write) ? diskStats.write : 0;

      if (this.previousStats) {
        // Calculate deltas (bytes changed since last measurement) to show in chart
        const deltaRead = Math.max(currentRead - this.previousStats.read, 0);
        const deltaWrite = Math.max(currentWrite - this.previousStats.write, 0);

        // Only update if deltas are valid numbers
        if (Number.isFinite(deltaRead) && Number.isFinite(deltaWrite)) {
          this.cachedDiskStats.update((cachedStats) => {
            return [...cachedStats, [deltaRead, deltaWrite]].slice(-this.numberOfPoints);
          });
        }
      }
      this.previousStats = { read: currentRead, write: currentWrite };
    });
  }
}
