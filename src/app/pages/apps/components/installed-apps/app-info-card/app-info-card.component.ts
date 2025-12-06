import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, WritableSignal, inject } from '@angular/core';
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
  filter, switchMap, tap,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpdateDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpdateDialog } from 'app/pages/apps/components/installed-apps/app-update-dialog/app-update-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatCardActions,
    CleanLinkPipe,
    MatTooltip,
    IxIconComponent,
    RouterLink,
  ],
})
export class AppInfoCardComponent {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private redirect = inject(RedirectService);
  private errorHandler = inject(ErrorHandlerService);
  private appService = inject(ApplicationsService);
  private matDialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private installedAppsStore = inject(InstalledAppsStore);
  private slideIn = inject(SlideIn);
  private window = inject<Window>(WINDOW);

  readonly app = input.required<App>();
  readonly startApp = output();
  readonly stopApp = output();
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

  readonly sortedPortals = computed(() => {
    const portals = this.app().portals;
    const entries = Object.entries(portals).map(([label, url]) => ({ label, url }));

    const webUiIndex = entries.findIndex((entry) => entry.label.toLowerCase() === 'web ui');
    if (webUiIndex > -1) {
      const [webUi] = entries.splice(webUiIndex, 1);
      return [webUi, ...entries];
    }

    return entries;
  });

  protected readonly appDetailsRouterUrl = computed<string[]>(() => {
    const app = this.app();
    return ['/apps', 'available', app.metadata.train, app.metadata.name];
  });

  protected readonly name = computed(() => {
    if (this.app().name === this.app().metadata.name) {
      return this.app().name;
    }

    if (this.app().custom_app) {
      return this.app().name;
    }

    return `${this.app().name} (${this.app().metadata.name})`;
  });

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
        (summary) => this.matDialog.open(AppUpdateDialog, {
          width: '50vw',
          minWidth: '500px',
          maxWidth: '750px',
          data: {
            appInfo: this.app(),
            upgradeSummary: summary,
          } as AppUpdateDialogConfig,
        }).afterClosed(),
      ),
      filter(Boolean),
      switchMap(
        (version: string) => this.dialogService.jobDialog(
          this.api.job('app.upgrade', [name, { app_version: version }]),
          { title: this.translate.instant(helptextApps.apps.upgrading) },
        ).afterClosed(),
      ),
      this.errorHandler.withErrorHandler(),
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
          AppDeleteDialog,
          AppDeleteDialogInputData,
          AppDeleteDialogOutputData
        >(AppDeleteDialog, {
          data: { name, showRemoveVolumes: ixVolumeExists },
        }).afterClosed();
      }),
      filter(Boolean),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    )
      .subscribe((options) => this.executeDelete(name, options));
  }

  private executeDelete(name: string, options: AppDeleteDialogOutputData): void {
    this.dialogService.jobDialog(
      this.api.job('app.delete', [name, {
        remove_images: options.removeImages,
        remove_ix_volumes: options.removeVolumes,
        force_remove_ix_volumes: options.forceRemoveVolumes,
      }]),
      { title: this.translate.instant(helptextApps.apps.deleting) },
    )
      .afterClosed()
      .pipe(
        filter(Boolean),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/apps', 'installed']);
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
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe();
  }
}
