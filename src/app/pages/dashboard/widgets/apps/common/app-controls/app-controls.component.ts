import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
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
  imports: [
    WithLoadingStateDirective,
    MatIconButton,
    TestDirective,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
  ],
})
export class AppControlsComponent {
  private translate = inject(TranslateService);
  private redirect = inject(RedirectService);
  private snackbar = inject(SnackbarService);
  private appService = inject(ApplicationsService);
  private router = inject(Router);

  app = input.required<LoadingState<App>>();
  appState = AppState;

  portalEntries = computed(() => Object.entries(this.app()?.value?.portals).map(([label, url]) => ({ label, url })));

  mainPortal = computed(() => {
    const entries = this.portalEntries();
    const webUi = entries.find((entry) => entry.label.toLowerCase().includes('web ui'));
    return webUi ?? entries[0] ?? null;
  });

  otherPortals = computed(() => {
    const main = this.mainPortal();
    return this.portalEntries().filter((entry) => entry !== main);
  });

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

  openAppDetails(app: App): void {
    this.router.navigate(['/apps', 'installed', app.metadata.train, app.id]);
  }

  openPortal(url: string): void {
    this.redirect.openWindow(url);
  }
}
