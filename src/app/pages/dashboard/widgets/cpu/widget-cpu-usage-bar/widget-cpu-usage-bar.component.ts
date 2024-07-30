import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { cpuUsageBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-bar/widget-cpu-usage-bar.definition';

@Component({
  selector: 'ix-widget-cpu-usage-bar',
  templateUrl: './widget-cpu-usage-bar.component.html',
  styleUrls: ['./widget-cpu-usage-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuUsageBarComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuUsageBarWidget.name;
}
