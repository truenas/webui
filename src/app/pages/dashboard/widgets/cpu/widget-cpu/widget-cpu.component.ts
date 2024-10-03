import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { AllCpusUpdate } from 'app/interfaces/reporting.interface';
import { GaugeData } from 'app/modules/charts/view-chart-gauge/view-chart-gauge.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuParams } from 'app/pages/dashboard/widgets/cpu/interfaces/cpu-params.interface';
import { cpuWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu/widget-cpu.definition';
import { AppsState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-cpu',
  templateUrl: './widget-cpu.component.html',
  styleUrl: './widget-cpu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuComponent {
  size = input.required<SlotSize>();
  protected readonly name = cpuWidget.name;

  protected sysInfo = toSignal(this.store$.pipe(waitForSystemInfo));

  protected cpuData = toSignal(this.resources.realtimeUpdates$.pipe(
    map((update) => update.fields.cpu),
  ));

  protected isLoading = computed(() => !this.cpuData() || !this.sysInfo());
  protected cpuModel = computed(() => this.sysInfo().model);
  protected coreCount = computed(() => this.sysInfo().physical_cores);
  protected threadCount = computed(() => this.sysInfo().cores);
  protected hyperthread = computed(() => this.sysInfo().cores !== this.sysInfo().physical_cores);

  protected highest = computed(() => {
    const cpuParams = this.getCpuParams();
    if (cpuParams.usageMax) {
      if (cpuParams.usageMaxThreads.length === 0) {
        return this.translate.instant('{usage}% (All Threads)', { usage: cpuParams.usageMax });
      }
      if (cpuParams.usageMaxThreads.length === 1) {
        return this.translate.instant('{usage}% (Thread #{thread})', {
          usage: cpuParams.usageMax,
          thread: cpuParams.usageMaxThreads.toString(),
        });
      }
      return this.translate.instant('{usage}% ({threadCount} threads at {usage}%)', {
        usage: cpuParams.usageMax,
        threadCount: cpuParams.usageMaxThreads.length,
      });
    }
    return this.translate.instant('N/A');
  });

  protected hottest = computed(() => {
    const cpuParams = this.getCpuParams();
    if (cpuParams.tempMax) {
      if (cpuParams.tempMaxThreads.length === 0) {
        return this.translate.instant('{temp}°C (All Threads)', { temp: cpuParams.tempMax });
      }
      if (cpuParams.tempMaxThreads.length === 1) {
        return this.translate.instant('{temp}°C (Core #{core})', {
          temp: cpuParams.tempMax,
          thread: cpuParams.tempMaxThreads.toString(),
        });
      }
      return this.translate.instant('{temp}°C ({coreCount} cores at {temp}°C)', {
        temp: cpuParams.tempMax,
        coreCount: cpuParams.tempMaxThreads.length,
      });
    }
    return this.translate.instant('N/A');
  });

  constructor(
    private store$: Store<AppsState>,
    private resources: WidgetResourcesService,
    private translate: TranslateService,
  ) {}

  protected parseCpuData(cpuData: AllCpusUpdate): GaugeData[] {
    const usageColumn: GaugeData = ['Usage'];
    let temperatureColumn: GaugeData = ['Temperature'];
    const temperatureValues = [];

    // Filter out stats per thread
    const keys = Object.keys(cpuData);
    const threads = keys.filter((cpuUpdateAttribute) => !Number.isNaN(parseFloat(cpuUpdateAttribute)));

    for (let i = 0; i < this.threadCount(); i++) {
      usageColumn.push(parseInt(cpuData[i].usage.toFixed(1)));

      if (cpuData.temperature_celsius) {
        const mod = threads.length % 2;
        const temperatureIndex = this.hyperthread ? Math.floor(i / 2 - mod) : i;
        if (cpuData.temperature_celsius?.[temperatureIndex]) {
          temperatureValues.push(parseInt(cpuData.temperature_celsius[temperatureIndex].toFixed(0)));
        }
      }
    }
    temperatureColumn = temperatureColumn.concat(temperatureValues);

    return [usageColumn, temperatureColumn];
  }

  protected getCpuParams(): CpuParams {
    const data = this.parseCpuData(this.cpuData());
    const usage = data[0].slice(1) as number[];
    const temps = data[1].slice(1) as number[];

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

    const tempMin = temps?.length ? Number(Math.min(...temps).toFixed(0)) : 0;
    const tempMax = temps?.length ? Number(Math.max(...temps).toFixed(0)) : 0;

    const tempMinThreads = [];
    const tempMaxThreads = [];
    for (let i = 0; i < temps.length; i++) {
      if (temps[i] === tempMin) {
        tempMinThreads.push(Number(i.toFixed(0)));
      }

      if (temps[i] === tempMax) {
        tempMaxThreads.push(Number(i.toFixed(0)));
      }
    }

    return {
      tempMin,
      tempMax,
      tempMinThreads,
      tempMaxThreads,
      usageMin,
      usageMax,
      usageMinThreads,
      usageMaxThreads,
    };
  }
}
