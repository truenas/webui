import {
  Component, ChangeDetectionStrategy, input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App } from 'app/interfaces/chart-release.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { RedirectService } from 'app/services/redirect.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-controls',
  templateUrl: './app-controls.component.html',
  styleUrls: ['./app-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppControlsComponent {
  app = input.required<LoadingState<App>>();

  protected isRestarting = signal<boolean>(false);

  constructor(
    private translate: TranslateService,
    private redirect: RedirectService,
    private snackbar: SnackbarService,
    private appService: ApplicationsService,
    private router: Router,
  ) {}

  onRestartApp(app: App): void {
    this.isRestarting.set(true);
    this.snackbar.success(this.translate.instant('App is restarting'));

    this.appService.restartApplication(app)
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isRestarting.set(false);
          this.snackbar.success(this.translate.instant('App is restarted'));
        },
      });
  }

  openWebPortal(app: App): void {
    const webPortal = Object.values(app.portals);
    if (webPortal?.[0]) {
      this.redirect.openWindow(webPortal[0]);
    }
  }

  openAppDetails(app: App): void {
    this.router.navigate(['/apps', 'installed', app.catalog_train, app.id]);
  }
}
