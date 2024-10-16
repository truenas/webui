import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { cpuTemperatureBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.definition';

@Component({
  selector: 'ix-widget-cpu-temperature-bar',
  templateUrl: './widget-cpu-temperature-bar.component.html',
  styleUrls: ['./widget-cpu-temperature-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CpuCoreBarComponent, TranslateModule],
})
export class WidgetCpuTemperatureBarComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuTemperatureBarWidget.name;
}
