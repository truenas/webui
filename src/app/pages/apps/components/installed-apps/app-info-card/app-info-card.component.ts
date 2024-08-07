import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { startCase, isEmpty } from 'lodash';
import { filter, map, take } from 'rxjs';
import { appImagePlaceholder, ixChartApp } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { ChartUpgradeDialogConfig } from 'app/interfaces/chart-upgrade-dialog-config.interface';
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
  @Input() app: App;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Input() status: AppStatus;

  readonly imagePlaceholder = appImagePlaceholder;
  readonly isEmpty = isEmpty;

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

  get hasUpdates(): boolean {
    return this.app?.upgrade_available || this.app?.container_images_update_available;
  }

  get ixChartApp(): boolean {
    return this.app.metadata.name === ixChartApp;
  }

  portalName(name = 'web_portal'): string {
    return startCase(name);
  }

  portalLink(app: App, name = 'web_portal'): void {
    this.redirect.openWindow(app.portals[name][0]);
  }

  updateButtonPressed(): void {
    const name = this.app.name;

    this.appService.getChartUpgradeSummary(name).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((summary: AppUpgradeSummary) => {
      this.matDialog.open(AppUpgradeDialogComponent, {
        width: '50vw',
        minWidth: '500px',
        maxWidth: '750px',
        data: {
          appInfo: this.app,
          upgradeSummary: summary,
        } as ChartUpgradeDialogConfig,
      })
        .afterClosed()
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe((version: string) => {
          this.dialogService.jobDialog(
            this.ws.job('app.upgrade', [name, { app_version: version }]),
            { title: helptextApps.charts.upgrade_dialog.job },
          )
            .afterClosed()
            .pipe(this.errorHandler.catchError(), untilDestroyed(this))
            .subscribe();
        });
    });
  }

  editButtonPressed(): void {
    this.router.navigate(['/apps', 'installed', this.app.catalog, this.app.catalog_train, this.app.id, 'edit']);
  }

  deleteButtonPressed(): void {
    const name = this.app.name;

    this.dialogService.confirm({
      title: helptextApps.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.executeDelete(name));
  }

  executeDelete(name: string): void {
    this.dialogService.jobDialog(
      this.ws.job('app.delete', [name, { remove_images: true }]),
      { title: helptextApps.charts.delete_dialog.job },
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
    this.matDialog.open(AppRollbackModalComponent, { data: this.app });
  }
}
