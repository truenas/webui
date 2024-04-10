import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-hostname',
  templateUrl: './widget-hostname.component.html',
  styleUrls: ['./widget-hostname.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHostnameComponent implements WidgetComponent {
  size = input.required<SlotSize>();

  systemInfo$ = this.resources.systemInfo$;

  constructor(
    private resources: WidgetResourcesService,
  ) {}
}
