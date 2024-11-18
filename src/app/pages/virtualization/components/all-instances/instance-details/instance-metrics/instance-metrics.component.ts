import {
  ChangeDetectionStrategy, Component, input, signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  distinctUntilChanged, filter, switchMap, map,
} from 'rxjs';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance, VirtualizationInstanceMetrics } from 'app/interfaces/virtualization.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { InstanceMetricsLineChartComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-metrics/instance-metrics-linechart/instance-metrics-linechart.component';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-metrics',
  templateUrl: './instance-metrics.component.html',
  styleUrls: ['./instance-metrics.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
    InstanceMetricsLineChartComponent,
  ],
})
export class InstanceMetricsComponent {
  instance = input.required<VirtualizationInstance>();

  virtualizationStatus = VirtualizationStatus;

  cpuData = signal<number[]>([]);
  memoryData = signal<number[]>([]);
  ioPressureData = signal<number[]>([]);
  timeLabels = signal<number[]>([]);
  isLoading = signal<boolean>(true);

  constructor(
    protected formatter: IxFormatterService,
    private api: ApiService,
  ) {
    toObservable(this.instance).pipe(
      filter((instance): instance is VirtualizationInstance => instance.status === VirtualizationStatus.Running),
      distinctUntilChanged((prev, curr) => prev.id === curr.id),
      switchMap((instance) => {
        this.resetData();
        return this.api.subscribe(`virt.instance.metrics:{"id": "${instance.id}"}`);
      }),
      map((response) => response.fields),
      untilDestroyed(this),
    ).subscribe((fields: VirtualizationInstanceMetrics) => {
      this.updateData(fields);
      this.isLoading.set(false);
    });
  }

  private resetData(): void {
    this.cpuData.set([]);
    this.memoryData.set([]);
    this.ioPressureData.set([]);
    this.timeLabels.set([]);
    this.isLoading.set(true);
  }

  private updateData(fields: VirtualizationInstanceMetrics): void {
    const now = Date.now();

    this.cpuData.update((current) => ([
      ...current, fields.cpu.cpu_user_percentage,
    ]));

    this.memoryData.update((current) => ([
      ...current,
      fields.mem_utilization.mem_utilization_utilization_percentage,
    ]));

    this.ioPressureData.update((current) => ([
      ...current,
      fields.io_full_pressure.io_full_pressure_full_60_percentage,
    ]));

    this.timeLabels.update((current) => ([...current, now]));
  }
}
