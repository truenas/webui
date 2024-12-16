import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, effect, Inject, input, output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import ipRegex from 'ip-regex';
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
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

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
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
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
  });

  protected readonly appDetailsRouterUrl = computed<string[]>(() => {
    const app = this.app();
    return ['/apps', 'available', app.metadata.train, app.id];
  });

  constructor(
    private api: ApiService,
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
      const hostname = this.window.location.hostname;
      const isIpv6 = ipRegex.v6().test(hostname);
      portalUrl.hostname = isIpv6 ? `[${hostname}]` : hostname;
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
          this.api.job('app.upgrade', [name, { app_version: version }]),
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
        return this.matDialog.open<
          AppDeleteDialogComponent,
          AppDeleteDialogInputData,
          AppDeleteDialogOutputData
        >(AppDeleteDialogComponent, {
          data: { name, showRemoveVolumes: ixVolumeExists },
        }).afterClosed();
      }),
      filter(Boolean),
      untilDestroyed(this),
    )
      .subscribe((options) => this.executeDelete(name, options));
  }

  executeDelete(name: string, options: AppDeleteDialogOutputData): void {
    this.dialogService.jobDialog(
      this.api.job('app.delete', [name, {
        remove_images: options.removeImages,
        remove_ix_volumes: options.removeVolumes,
        force_remove_ix_volumes: options.forceRemoveVolumes,
      }]),
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
    this.api.call('app.rollback_versions', [appName]).pipe(
      tap((versions) => this.isRollbackPossible.set(versions.length > 0)),
      untilDestroyed(this),
    ).subscribe();
  }

  openConvertDialog(): void {
    const appName = this.app().name;
    this.dialogService.confirm({
      title: this.translate.instant('Convert to custom app'),
      message: this.translate.instant(
        'You are about to convert {appName} to a custom app. This will allow you to edit its yaml file directly.\nWarning. This operation cannot be undone.',
        { appName },
      ),
      buttonText: this.translate.instant('Convert'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.dialogService.jobDialog(
        this.api.job('app.convert_to_custom', [appName]),
        { title: this.translate.instant('Convert to custom app') },
      ).afterClosed()),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }
}
