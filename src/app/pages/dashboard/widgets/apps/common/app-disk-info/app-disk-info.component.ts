import {
  Component, ChangeDetectionStrategy, input, computed,
  effect,
  signal,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';

@Component({
  selector: 'ix-app-disk-info',
  templateUrl: './app-disk-info.component.html',
  styleUrls: ['./app-disk-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    NgxSkeletonLoaderModule,
    NetworkChartComponent,
    TranslateModule,
    FileSizePipe,
  ],
})
export class AppDiskInfoComponent {
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

  constructor(
    private theme: ThemeService,
    private translate: TranslateService,
  ) {
    effect(() => {
      const diskStats = this.stats()?.value?.blkio;
      if (diskStats) {
        this.cachedDiskStats.update((cachedStats) => {
          return [...cachedStats, [diskStats.read, diskStats.write]].slice(-this.numberOfPoints);
        });
      }
    });
  }
}
