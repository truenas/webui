import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { startCase, isEmpty } from 'lodash';
import { filter, map, take } from 'rxjs';
import { appImagePlaceholder, ixChartApp } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ChartUpgradeDialogConfig } from 'app/interfaces/chart-upgrade-dialog-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  @Input() app: ChartRelease;

  readonly imagePlaceholder = appImagePlaceholder;
  readonly isEmpty = isEmpty;

  constructor(
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
    return this.app?.update_available || this.app?.container_images_update_available;
  }

  get ixChartApp(): boolean {
    return this.app.chart_metadata.name === ixChartApp;
  }

  portalName(name = 'web_portal'): string {
    return startCase(name);
  }

  portalLink(app: ChartRelease, name = 'web_portal'): void {
    this.redirect.openWindow(app.portals[name][0]);
  }

  updateButtonPressed(): void {
    const name = this.app.name;

    this.appService.getChartUpgradeSummary(name).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((summary: UpgradeSummary) => {
      const dialogRef = this.matDialog.open(AppUpgradeDialogComponent, {
        width: '50vw',
        minWidth: '500px',
        maxWidth: '750px',
        data: {
          appInfo: this.app,
          upgradeSummary: summary,
        } as ChartUpgradeDialogConfig,
      });
      dialogRef.afterClosed().pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe((version: string) => {
        const jobDialogRef = this.matDialog.open(EntityJobComponent, {
          data: {
            title: helptext.charts.upgrade_dialog.job,
          },
        });
        jobDialogRef.componentInstance.setCall('chart.release.upgrade', [name, { item_version: version }]);
        jobDialogRef.componentInstance.submit();
        jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.closeAllDialogs();
        });
        jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
          this.dialogService.closeAllDialogs();
          this.dialogService.error(this.errorHandler.parseJobError(error));
        });
      });
    });
  }

  editButtonPressed(): void {
    this.router.navigate(['/apps', 'installed', this.app.catalog, this.app.catalog_train, this.app.id, 'edit']);
  }

  deleteButtonPressed(): void {
    const name = this.app.name;

    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.executeDelete(name));
  }

  executeDelete(name: string): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.charts.delete_dialog.job,
      },
    });
    dialogRef.componentInstance.setCall('chart.release.delete', [name, { delete_unused_images: true }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.installedAppsStore.installedApps$.pipe(
        map((apps) => !apps.length),
        take(1),
        untilDestroyed(this),
      ).subscribe((noApps) => {
        if (noApps) {
          this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
        }
        this.dialogService.closeAllDialogs();
      });
    });
  }

  rollbackApp(): void {
    this.matDialog.open(AppRollbackModalComponent, { data: this.app });
  }
}
