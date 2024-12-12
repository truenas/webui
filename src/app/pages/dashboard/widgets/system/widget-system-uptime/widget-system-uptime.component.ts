import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { systemUptimeWidget } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.definition';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'ix-widget-system-uptime',
  templateUrl: './widget-system-uptime.component.html',
  styleUrls: ['./widget-system-uptime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    WidgetDatapointComponent,
    TranslateModule,
    UptimePipe,
  ],
})
export class WidgetSystemUptimeComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = systemUptimeWidget.name;

  systemInfo$ = this.resources.systemInfo$;

  loadedSystemInfo = toSignal(this.systemInfo$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value),
  ));

  startTime = Date.now();

  realElapsedSeconds = toSignal(this.resources.refreshInterval$.pipe(
    map(() => {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }),
  ));

  uptime = computed(() => {
    return this.loadedSystemInfo().uptime_seconds + this.realElapsedSeconds();
  });

  datetime = computed(() => {
    this.realElapsedSeconds();
    const [, timeValue] = this.localeService.getDateAndTime();
    return `${timeValue.split(':')[0]}:${timeValue.split(':')[1]}`;
  });

  constructor(
    private resources: WidgetResourcesService,
    private localeService: LocaleService,
  ) {}
}
