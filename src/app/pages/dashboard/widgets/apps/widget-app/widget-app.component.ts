import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input,
  computed,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppCardInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-card-info/app-card-info.component';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppCpuInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-cpu-info/app-cpu-info.component';
import { AppDiskInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-disk-info/app-disk-info.component';
import { AppMemoryInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-memory-info/app-memory-info.component';
import { AppNetworkInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-network-info/app-network-info.component';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';

@Component({
  selector: 'ix-widget-app',
  templateUrl: './widget-app.component.html',
  styleUrls: ['./widget-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    WithLoadingStateDirective,
    MatCardContent,
    AppControlsComponent,
    AppCardLogoComponent,
    AppCardInfoComponent,
    AppCpuInfoComponent,
    AppNetworkInfoComponent,
    AppMemoryInfoComponent,
    AppDiskInfoComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class WidgetAppComponent implements WidgetComponent<WidgetAppSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();

  protected appName = computed(() => this.settings().appName);
  protected app = computed(() => this.resources.getApp(this.appName()));
  protected job = computed(() => this.resources.getAppStatusUpdates(this.appName()));
  protected stats$: Observable<LoadingState<AppStats>>;

  effect = effect(() => {
    this.stats$ = this.resources.getAppStats(this.appName());
    this.cdr.markForCheck();
  });

  constructor(
    private resources: WidgetResourcesService,
    private cdr: ChangeDetectorRef,
  ) {}
}
