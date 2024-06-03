import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { cpuTemperatureBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.definition';

@Component({
  selector: 'ix-widget-cpu-temperature-bar',
  templateUrl: './widget-cpu-temperature-bar.component.html',
  styleUrls: ['./widget-cpu-temperature-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetCpuTemperatureBarComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuTemperatureBarWidget.name;
}
