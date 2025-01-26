import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { cpuTempWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature/widget-cpu-temp.definition';

@Component({
  selector: 'ix-widget-cpu-temp',
  templateUrl: './widget-cpu-temp.component.html',
  styleUrls: ['./widget-cpu-temp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetCpuTempComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuTempWidget.name;

  protected readonly cpuTemp$ = this.resources.realtimeUpdates$.pipe(
    map((update) => {
      return update.fields.cpu?.cpu.temp
        ? `${update.fields.cpu?.cpu.temp} °C`
        : this.translate.instant('N/A');
    }),
    toLoadingState(),
  );

  constructor(
    private translate: TranslateService,
    private resources: WidgetResourcesService,
  ) {}
}
