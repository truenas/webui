import {
  Component, ChangeDetectionStrategy, input,
  computed,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter,
  map,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App } from 'app/interfaces/chart-release.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { RedirectService } from 'app/services/redirect.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-app',
  templateUrl: './widget-app.component.html',
  styleUrls: ['./widget-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppComponent implements WidgetComponent<WidgetAppSettings> {
  size = input.required<SlotSize>();
  settings = input.required<WidgetAppSettings>();

  appName = computed(() => this.settings().appName);
  application = computed(() => {
    return this.resources.getApp(this.appName()).pipe(toLoadingState());
  });
  appJob = toSignal(this.appService.getInstalledAppsStatusUpdates().pipe(
    filter((event) => event?.fields?.arguments[0] === this.appName()),
    map((event) => event.fields),
  ));

  appRestarting = signal<boolean>(false);

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private redirect: RedirectService,
    private appService: ApplicationsService,
    private snackbar: SnackbarService,
  ) {}

  onRestartApp(app: App): void {
    this.appRestarting.set(true);
    this.snackbar.success(this.translate.instant('App is restarting'));

    this.appService.restartApplication(app)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.appRestarting.set(false);
        this.snackbar.success(this.translate.instant('App is restarted'));
      });
  }

  openWebPortal(app: App): void {
    this.redirect.openWindow(app.portals['web_portal'][0]);
  }

  splitMemory(normalizedValue: string): [number, string] {
    const [value, unit] = normalizedValue.split(' ');
    return [+value, unit];
  }
}
