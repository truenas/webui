import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { map } from 'rxjs/operators';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { GaugeData } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { CpuParams } from 'app/pages/dashboard/widgets/cpu/interfaces/cpu-params.interface';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-cpu',
  templateUrl: './widget-cpu.component.html',
  styleUrl: './widget-cpu.component.scss',
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
    CpuChartGaugeComponent,
    MatList,
    MatListItem,
    NgxSkeletonLoaderModule,
    CpuCoreBarComponent,
    TranslateModule,
  ],
})
export class WidgetCpuComponent {
  size = input.required<SlotSize>();
  protected readonly name = cpuWidget.name;

  protected sysInfo = toSignal(this.store$.pipe(waitForSystemInfo));

  protected cpuData = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.cpu),
  ));

  cpuTemp = computed(() => this.cpuData()?.temperature_celsius || Math.floor(Math.random() * 99) + 1);

  protected isLoading = computed(() => !this.cpuData() || !this.sysInfo());
  protected cpuModel = computed(() => this.sysInfo()?.model);
  protected coreCount = computed(() => this.sysInfo()?.physical_cores);
  protected threadCount = computed(() => this.sysInfo()?.cores);

  protected highest = computed(() => {
    const cpuParams = this.getCpuParams();
    if (cpuParams.usageMax) {
      if (cpuParams.usageMaxThreads.length === 0) {
        return this.translate.instant('{usage}% (All Threads)', { usage: cpuParams.usageMax });
      }
      if (cpuParams.usageMaxThreads.length === 1) {
        return this.translate.instant('{usage}% (Thread #{thread})', {
          usage: cpuParams.usageMax,
          thread: cpuParams.usageMaxThreads[0] + 1,
        });
      }
      return this.translate.instant('{usage}% ({threadCount} threads at {usage}%)', {
        usage: cpuParams.usageMax,
        threadCount: cpuParams.usageMaxThreads.length,
      });
    }
    return this.translate.instant('N/A');
  });

  constructor(
    private store$: Store<AppState>,
    private resources: WidgetResourcesService,
    private translate: TranslateService,
  ) {}

  protected parseCpuData(cpuData: AllCpusUpdate): GaugeData[] {
    const usageColumn: GaugeData = ['Usage'];

    for (let i = 0; i < this.threadCount(); i++) {
      usageColumn.push(parseInt(cpuData[`core${i}_usage`].toFixed(1)));
    }

    return [usageColumn];
  }

  protected getCpuParams(): CpuParams {
    const data = this.parseCpuData(this.cpuData());
    const usage = data[0].slice(1) as number[];

    const usageMin = usage?.length ? Number(Math.min(...usage).toFixed(0)) : 0;
    const usageMax = usage?.length ? Number(Math.max(...usage).toFixed(0)) : 0;

    const usageMinThreads = [];
    const usageMaxThreads = [];
    for (let i = 0; i < usage.length; i++) {
      if (usage[i] === usageMin) {
        usageMinThreads.push(Number(i.toFixed(0)));
      }

      if (usage[i] === usageMax) {
        usageMaxThreads.push(Number(i.toFixed(0)));
      }
    }

    return {
      usageMin,
      usageMax,
      usageMinThreads,
      usageMaxThreads,
    };
  }
}
