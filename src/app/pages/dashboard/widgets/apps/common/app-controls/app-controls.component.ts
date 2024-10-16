import { KeyValuePipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppState } from 'app/enums/app-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App } from 'app/interfaces/app.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { RedirectService } from 'app/services/redirect.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-controls',
  templateUrl: './app-controls.component.html',
  styleUrls: ['./app-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    MatIconButton,
    TestDirective,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    KeyValuePipe,
  ],
})
export class AppControlsComponent {
  app = input.required<LoadingState<App>>();
  appState = AppState;

  constructor(
    private translate: TranslateService,
    private redirect: RedirectService,
    private snackbar: SnackbarService,
    private appService: ApplicationsService,
    private router: Router,
  ) {}

  onRestartApp(app: App): void {
    this.appService.restartApplication(app.name)
      .pipe(
        tapOnce(() => this.snackbar.success(this.translate.instant('App is restarting'))),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('App is restarted')),
      });
  }

  openWebPortal(app: App): void {
    const webPortal = Object.values(app.portals);
    if (webPortal?.length) {
      this.redirect.openWindow(webPortal[0]);
    }
  }

  openAppDetails(app: App): void {
    this.router.navigate(['/apps', 'installed', app.metadata.train, app.id]);
  }
}
