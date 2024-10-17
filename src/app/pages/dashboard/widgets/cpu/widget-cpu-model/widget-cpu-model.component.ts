import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { cpuModelWidget } from 'app/pages/dashboard/widgets/cpu/widget-cpu-model/widget-cpu-model.definition';

@Component({
  selector: 'ix-widget-cpu-model',
  templateUrl: './widget-cpu-model.component.html',
  styleUrls: ['./widget-cpu-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetCpuModelComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  readonly name = cpuModelWidget.name;

  cpuModel$ = this.resources.cpuModel$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
