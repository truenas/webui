import {
  Component, ChangeDetectionStrategy, input,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
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
  app = input.required<LoadingState<ChartRelease>>();

  protected isRestarting = signal<boolean>(false);

  constructor(
    private translate: TranslateService,
    private redirect: RedirectService,
    private snackbar: SnackbarService,
    private appService: ApplicationsService,
  ) {}

  onRestartApp(app: ChartRelease): void {
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

  openWebPortal(app: ChartRelease): void {
    this.redirect.openWindow(app.portals.web_portal[0]);
  }
}
