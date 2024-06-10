import {
  Component, OnInit, ChangeDetectionStrategy, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';

@Component({
  selector: 'ix-widget-app',
  templateUrl: './widget-app.component.html',
  styleUrls: ['./widget-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppComponent implements WidgetComponent<WidgetAppSettings>, OnInit {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();
  time = toSignal(this.resources.serverTime$);

  constructor(private resources: WidgetResourcesService) {}

  ngOnInit(): void {
    console.info('init');
  }

  onRestartApp(): void {
    // Restart app logic
  }
}
