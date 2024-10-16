import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, computed, input,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppMemoryInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-memory-info/app-memory-info.component';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';

@Component({
  selector: 'ix-widget-app-memory',
  templateUrl: './widget-app-memory.component.html',
  styleUrls: [
    '../widget-app/widget-app.component.scss',
    './widget-app-memory.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    WithLoadingStateDirective,
    MatCardContent,
    AppControlsComponent,
    AppMemoryInfoComponent,
    AsyncPipe,
  ],
})
export class WidgetAppMemoryComponent implements WidgetComponent<WidgetAppSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();

  appName = computed(() => this.settings().appName);
  app = computed(() => this.resources.getApp(this.appName()));
  job = computed(() => this.resources.getAppStatusUpdates(this.appName()));
  stats = computed(() => this.resources.getAppStats(this.appName()));

  constructor(private resources: WidgetResourcesService) {}
}
