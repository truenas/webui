import {
  Component, ChangeDetectionStrategy, computed, input,
} from '@angular/core';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';

@Component({
  selector: 'ix-widget-app-memory',
  templateUrl: './widget-app-memory.component.html',
  styleUrls: ['./widget-app-memory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppMemoryComponent implements WidgetComponent<WidgetAppSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();

  appName = computed(() => this.settings().appName);
  app = computed(() => this.resources.getApp(this.appName()).pipe(toLoadingState()));
  job = computed(() => this.resources.getAppStatusUpdates(this.appName()));
  stats = computed(() => this.resources.getAppStats(this.appName()).pipe(toLoadingState()));

  constructor(private resources: WidgetResourcesService) {}
}
