import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { GaugeConfig, ViewChartGaugeComponent } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { WidgetStaleDataNoticeComponent } from 'app/pages/dashboard/components/widget-stale-data-notice/widget-stale-data-notice.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';

@Component({
  selector: 'ix-cpu-chart-gauge',
  templateUrl: './cpu-chart-gauge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule, ViewChartGaugeComponent, WidgetStaleDataNoticeComponent],
})
export class CpuChartGaugeComponent {
  private resources = inject(WidgetResourcesService);
  private translate = inject(TranslateService);

  protected cpuDataState = toSignal(
    this.resources.cpuUpdatesWithStaleDetection().pipe(takeUntilDestroyed()),
  );

  protected isStale = computed(() => this.cpuDataState()?.isStale ?? false);
  protected isLoading = computed(() => !this.cpuDataState()?.value && !this.isStale());

  protected cpuAvg: Signal<GaugeConfig> = computed(() => {
    const cpuData = this.cpuDataState()?.value;
    const data = ['Load', cpuData ? parseInt(cpuData.cpu.usage.toFixed(1)) : 0];
    return {
      label: false,
      data,
      units: '%',
      diameter: 136,
      fontSize: 28,
      max: 100,
      subtitle: this.translate.instant('Avg Usage'),
    };
  });
}
