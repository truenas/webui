import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import {
  hostnamePassiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-hostname-passive/widget-hostname-passive.definition';

@Component({
  selector: 'ix-widget-hostname-passive',
  templateUrl: './widget-hostname-passive.component.html',
  styleUrls: ['./widget-hostname-passive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHostnamePassiveComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = hostnamePassiveWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
