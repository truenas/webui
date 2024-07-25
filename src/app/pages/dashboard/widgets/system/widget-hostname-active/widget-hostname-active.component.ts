import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { hostnameActiveWidget } from 'app/pages/dashboard/widgets/system/widget-hostname-active/widget-hostname-active.definition';

@Component({
  selector: 'ix-widget-hostname-active',
  templateUrl: './widget-hostname-active.component.html',
  styleUrls: ['./widget-hostname-active.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHostnameActiveComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = hostnameActiveWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
