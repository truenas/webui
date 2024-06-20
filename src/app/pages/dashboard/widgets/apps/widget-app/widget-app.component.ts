import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-widget-app',
  templateUrl: './widget-app.component.html',
  styleUrls: ['./widget-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppComponent implements WidgetComponent<WidgetAppSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();
  time = toSignal(this.resources.serverTime$);
  application = computed(() => {
    return this.resources.getApp(this.settings().appName).pipe(toLoadingState());
  });
  stats = computed(() => {
    return this.resources.getAppStats(this.settings().appName).pipe(toLoadingState());
  });

  protected networkCachedStats = computed(() => {
    const appName = this.settings().appName;
    const stats = this.resources.cachedAppStats();
    console.info('networkCachedStats', stats);
    return (stats[appName] || []).map((appStats) => Object.values(appStats.network));
  });

  protected networkChartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const data = this.networkCachedStats();
    const labels: number[] = data.map((_, index) => (0 + index) * 1000);

    console.info('data', data);

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

  constructor(
    private resources: WidgetResourcesService,
    private theme: ThemeService,
    private translate: TranslateService,
  ) {}

  onRestartApp(): void {
    // Restart app logic
  }
}
