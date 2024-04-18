import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { map, take } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-memory',
  templateUrl: './widget-memory.component.html',
  styleUrl: './widget-memory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetMemoryComponent {
  size = input.required<SlotSize>();

  protected ecc$ = this.store$.pipe(waitForSystemInfo, map((sysInfo) => sysInfo.ecc_memory));

  protected memory = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.virtual_memory),
    take(1),
  ));

  protected isLoading = computed(() => !this.memory());

  protected arcSize = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.zfs?.arc_size),
    take(1),
  ));

  stats = computed(() => {
    const colors = [0, 1, 2].map((i) => this.theme.getRgbBackgroundColorByIndex(i));
    let services: number | undefined;
    if (!this.isLoading()) {
      services = this.memory().total - this.memory().free - this.arcSize();
    }

    return [
      {
        name: this.translate.instant('Free'),
        color: colors[0],
        value: this.memory()?.free,
      },
      {
        name: this.translate.instant('ZFS Cache'),
        color: colors[1],
        value: this.arcSize(),
      },
      {
        name: this.translate.instant('Services'),
        color: colors[2],
        value: services,
      },
    ];
  });

  chartData = computed<ChartData<'doughnut'>>(() => {
    const labels = this.stats().map((stat) => stat.name);
    const values = this.stats().map((stat) => stat.value);
    const backgroundColors = this.stats().map((stat) => this.themeUtils.rgbToString(stat.color, 0.85));
    const borderColors = this.stats().map((stat) => this.themeUtils.rgbToString(stat.color));

    return {
      labels,
      datasets: [{
        data: values,
        borderWidth: 1,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
      }],
    };
  });

  chartOptions = computed<ChartOptions<'doughnut'>>(() => {
    return {
      cutout: '50%',
      plugins: {
        tooltip: {
          enabled: false,
        },
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
    };
  });

  private themeUtils = new ThemeUtils();

  constructor(
    private store$: Store<AppState>,
    private resources: WidgetResourcesService,
    private theme: ThemeService,
    private translate: TranslateService,
  ) {}

  protected formatUnit(bytes: number): string {
    return (bytes / GiB).toFixed(1);
  }

  protected toRgb(color: number[]): string {
    return this.themeUtils.rgbToString(color);
  }
}
