import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import {
  serialActiveWidget,
} from 'app/pages/dashboard/widgets/system/widget-serial-active/widget-serial-active.definition';

@Component({
  selector: 'ix-widget-serial-active',
  templateUrl: './widget-serial-active.component.html',
  styleUrls: ['./widget-serial-active.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSerialActiveComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = serialActiveWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
