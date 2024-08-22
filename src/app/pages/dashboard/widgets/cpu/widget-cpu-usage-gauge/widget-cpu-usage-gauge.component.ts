import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { cpuUsageGaugeWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.definition';

@Component({
  selector: 'ix-widget-cpu-usage-gauge',
  templateUrl: './widget-cpu-usage-gauge.component.html',
  styleUrls: ['./widget-cpu-usage-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuUsageGaugeComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  protected readonly name = cpuUsageGaugeWidget.name;
}
