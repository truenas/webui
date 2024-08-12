import {
  ChangeDetectionStrategy, Component, computed, effect, EventEmitter, input, Input, InputSignal, Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash';
import {
  catchError,
  EMPTY,
  filter, map, of, switchMap, take, tap,
} from 'rxjs';
import { appImagePlaceholder, customApp } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { App } from 'app/interfaces/app.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  app: InputSignal<App> = input<App>();
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Input() status: AppStatus;

  readonly imagePlaceholder = appImagePlaceholder;
  readonly isEmpty = isEmpty;

  protected readonly isRollbackPossible: WritableSignal<boolean> = signal(false);

  protected rollbackSetEffect = effect(() => {
    this.isRollbackPossible.set(false);
    this.updateRollbackSetup();
  }, { allowSignalWrites: true });

  get inProgress(): boolean {
    return [AppStatus.Deploying].includes(this.status) || this.isStartingOrStopping;
  }

  get isAppStopped(): boolean {
    return this.status === AppStatus.Stopped;
  }

  get isStartingOrStopping(): boolean {
    return [AppStatus.Starting, AppStatus.Stopping].includes(this.status);
  }

  protected readonly requiredRoles = [Role.AppsWrite];

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
  ) {}

  protected hasUpdates = signal(false);

  private updatesSetupEffect = effect(() => {
    const app = this.app();
    this.hasUpdates.set(app?.upgrade_available);
  }, { allowSignalWrites: true });

  protected isCustomApp = computed(() => {
    const app = this.app();
    return app?.metadata?.name === customApp;
  });

  portalLink(app: App, name = 'web_portal'): void {
    this.redirect.openWindow(app.portals[name]);
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
      tap(() => {
        this.updateUpgradeSetup();
        this.updateRollbackSetup();
      }),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  editButtonPressed(): void {
    const app = this.app();
    this.router.navigate(['/apps', 'installed', app.metadata.train, app.id, 'edit']);
  }

  deleteButtonPressed(): void {
    const name = this.app().name;

    this.dialogService.confirm({
      title: helptextApps.apps.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.executeDelete(name));
  }

  executeDelete(name: string): void {
    this.dialogService.jobDialog(
      this.ws.job('app.delete', [name, { remove_images: true }]),
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
    this.matDialog.open(AppRollbackModalComponent, { data: this.app() }).afterClosed().pipe(
      tap(() => {
        this.updateRollbackSetup();
        this.updateUpgradeSetup();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private updateRollbackSetup(): void {
    const app = this.app();
    this.ws.call('app.rollback_versions', [app.name]).pipe(
      tap((versions) => this.isRollbackPossible.set(versions.length > 0)),
      untilDestroyed(this),
    ).subscribe();
  }

  private updateUpgradeSetup(): void {
    const app = this.app();
    this.appService.getAppUpgradeSummary(app.name).pipe(
      tap((summary) => this.hasUpdates.set(summary.available_versions_for_upgrade.length > 0)),
      catchError((error: WebSocketError) => {
        this.hasUpdates.set(false);
        return error?.reason?.includes('No upgrade available') ? EMPTY : of(error);
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
