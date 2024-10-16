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
import { osVersionWidget } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.definition';

@Component({
  selector: 'ix-widget-os-version',
  templateUrl: './widget-os-version.component.html',
  styleUrls: ['./widget-os-version.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
  ],
})
export class WidgetOsVersionComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = osVersionWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
