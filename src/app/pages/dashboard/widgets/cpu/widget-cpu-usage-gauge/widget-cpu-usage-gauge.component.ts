import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-cpu-usage-gauge',
  templateUrl: './widget-cpu-usage-gauge.component.html',
  styleUrls: ['./widget-cpu-usage-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuUsageGaugeComponent implements WidgetComponent {
  size = input.required<SlotSize>();
}
