import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { cpuUsageBarWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-bar/widget-cpu-usage-bar.definition';

@Component({
  selector: 'ix-widget-cpu-usage-bar',
  templateUrl: './widget-cpu-usage-bar.component.html',
  styleUrls: ['./widget-cpu-usage-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CpuCoreBarComponent, TranslateModule],
})
export class WidgetCpuUsageBarComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuUsageBarWidget.name;
}
