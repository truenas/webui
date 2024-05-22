import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { osVersionWidget } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.definition';

@Component({
  selector: 'ix-widget-os-version',
  templateUrl: './widget-os-version.component.html',
  styleUrls: ['./widget-os-version.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetOsVersionComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = osVersionWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
