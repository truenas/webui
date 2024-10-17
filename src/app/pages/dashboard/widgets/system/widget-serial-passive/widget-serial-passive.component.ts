import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import {
  serialPassiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-serial-passive/widget-serial-passive.definition';

@Component({
  selector: 'ix-widget-serial-passive',
  templateUrl: './widget-serial-passive.component.html',
  styleUrls: ['./widget-serial-passive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetSerialPassiveComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = serialPassiveWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
