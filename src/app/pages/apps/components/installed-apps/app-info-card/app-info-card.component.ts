import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, effect, Inject, input, output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import {
  filter, map, switchMap, take, tap,
} from 'rxjs';
import { appImagePlaceholder, customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    MatCardContent,
    ImgFallbackModule,
    OrNotAvailablePipe,
    KeyValuePipe,
    MatCardActions,
    CleanLinkPipe,
    AppVersionPipe,
    MatTooltip,
    IxIconComponent,
    RouterLink,
  ],
})
export class AppInfoCardComponent {
  readonly app = input<App>();
  readonly startApp = output();
  readonly stopApp = output();
  protected readonly isCustomApp = computed(() => this.app()?.metadata?.name === customApp);
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly isAppStopped = computed<boolean>(() => this.app()?.state === AppState.Stopped);
  protected readonly inProgress = computed<boolean>(() => [AppState.Deploying].includes(this.app()?.state));
  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly isRollbackPossible: WritableSignal<boolean> = signal(false);
  protected rollbackUpdateButtonSetEffect = effect(() => {
    const app = this.app();
    this.isRollbackPossible.set(false);
    this.updateRollbackSetup(app.name);
  }, { allowSignalWrites: true });

  protected readonly appDetailsRouterUrl = computed<string[]>(() => {
    const app = this.app();
    return ['/apps', 'available', app.metadata.train, app.id];
  });

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private redirect: RedirectService,
    private errorHandler: ErrorHandlerService,
    private appService: ApplicationsService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
    private router: Router,
    private installedAppsStore: InstalledAppsStore,
    private slideIn: SlideInService,
    @Inject(WINDOW) private window: Window,
  ) {}

  openPortalLink(app: App, name = 'web_portal'): void {
    const portalUrl = new URL(app.portals[name]);

    if (portalUrl.hostname === '0.0.0.0') {
      portalUrl.hostname = this.window.location.hostname;
    }

    this.redirect.openWindow(portalUrl.href);
  }

  updateButtonPressed(): void {
    const name = this.app().name;
    this.appService.getAppUpgradeSummary(name).pipe(
      this.loader.withLoader(),
      switchMap(
        (summary) => this.matDialog.open(AppUpgradeDialogComponent, {
          width: '50vw',
          minWidth: '500px',
          maxWidth: '750px',
          data: {
            appInfo: this.app(),
            upgradeSummary: summary,
          } as AppUpgradeDialogConfig,
        }).afterClosed(),
      ),
      filter(Boolean),
      switchMap(
        (version: string) => this.dialogService.jobDialog(
          this.ws.job('app.upgrade', [name, { app_version: version }]),
          { title: helptextApps.apps.upgrade_dialog.job },
        ).afterClosed(),
      ),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  editButtonPressed(): void {
    const app = this.app();
    if (app.custom_app) {
      this.slideIn.open(CustomAppFormComponent, { data: app });
    } else {
      this.router.navigate(['/apps', 'installed', app.metadata.train, app.id, 'edit']);
    }
  }

  deleteButtonPressed(): void {
    const name = this.app().name;

    this.appService.checkIfAppIxVolumeExists(name).pipe(
      this.loader.withLoader(),
      switchMap((ixVolumeExists) => {
        return this.dialogService.confirm({
          title: helptextApps.apps.delete_dialog.title,
          message: this.translate.instant('Delete {name}?', { name }),
          secondaryCheckbox: ixVolumeExists,
          secondaryCheckboxText: this.translate.instant('Remove iXVolumes'),
        });
      }),
      filter(({ confirmed }) => confirmed),
      untilDestroyed(this),
    )
      .subscribe(({ secondaryCheckbox }) => this.executeDelete(name, secondaryCheckbox));
  }

  executeDelete(name: string, removeIxVolumes = false): void {
    this.dialogService.jobDialog(
      this.ws.job('app.delete', [name, { remove_images: true, remove_ix_volumes: removeIxVolumes }]),
      { title: helptextApps.apps.delete_dialog.job },
    )
      .afterClosed()
      .pipe(
        filter(Boolean),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.installedAppsStore.installedApps$.pipe(
          map((apps) => !apps.length),
          filter(Boolean),
          take(1),
          untilDestroyed(this),
        ).subscribe(() => {
          this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
        });
      });
  }

  rollbackApp(): void {
    this.matDialog
      .open(AppRollbackModalComponent, { data: this.app() })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private updateRollbackSetup(appName: string): void {
    this.ws.call('app.rollback_versions', [appName]).pipe(
      tap((versions) => this.isRollbackPossible.set(versions.length > 0)),
      untilDestroyed(this),
    ).subscribe();
  }
}
