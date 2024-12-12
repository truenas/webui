import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { cpuUsageGaugeWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.definition';

@Component({
  selector: 'ix-widget-cpu-usage-gauge',
  templateUrl: './widget-cpu-usage-gauge.component.html',
  styleUrls: ['./widget-cpu-usage-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CpuChartGaugeComponent, TranslateModule],
})
export class WidgetCpuUsageGaugeComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  protected readonly name = cpuUsageGaugeWidget.name;
}
