import {
  Component, ChangeDetectionStrategy, input,
  computed,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import {
  shareReplay,
  tap,
} from 'rxjs';
import { chartStatusIcons } from 'app/enums/chart-release-status.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-app',
  templateUrl: './widget-app.component.html',
  styleUrls: ['./widget-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppComponent implements WidgetComponent<WidgetAppSettings> {
  protected readonly appStatusIcons = chartStatusIcons;
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();

  appName = computed(() => this.settings().appName);
  application = computed(() => {
    return this.resources.getApp(this.appName()).pipe(toLoadingState());
  });
  stats = computed(() => {
    return this.resources.getAppStats(this.appName()).pipe(
      tap((realtimeStats) => {
        this.cachedNetworkStats.update((cachedStats) => {
          return [...cachedStats, Object.values(realtimeStats.network)].slice(-60);
        });
      }),
      toLoadingState(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  });

  initialNetworkStats = Array.from({ length: 60 }, () => ([0, 0]));
  cachedNetworkStats = signal<number[][]>([]);

  networkStats = computed(() => {
    const cachedStats = this.cachedNetworkStats();
    return [...this.initialNetworkStats, ...cachedStats].slice(-60);
  });

  protected networkChartData = computed<ChartData<'line'>>(() => {
    const currentTheme = this.theme.currentTheme();
    const data = this.networkStats();
    const labels: number[] = data.map((_, index) => (0 + index) * 1000);

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
    private redirect: RedirectService,
    private appService: ApplicationsService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  onRestartApp(app: ChartRelease): void {
    console.info('onRestartApp', app);
    this.dialogService.jobDialog(
      this.appService.restartApplication(app),
      { title: app.name, canMinimize: true },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  openWebPortal(app: ChartRelease): void {
    this.redirect.openWindow(app.portals['web_portal'][0]);
  }

  splitMemory(normalizedValue: string): [number, string] {
    const [value, unit] = normalizedValue.split(' ');
    return [+value, unit];
  }
}
