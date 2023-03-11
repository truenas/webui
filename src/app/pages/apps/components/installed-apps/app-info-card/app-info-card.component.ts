import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { startCase } from 'lodash';
import { filter } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ChartUpgradeDialogComponent } from 'app/pages/apps-old/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { ChartUpgradeDialogConfig } from 'app/pages/apps-old/interfaces/chart-upgrade-dialog-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { RedirectService, AppLoaderService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  @Input() app: ChartRelease;
  @Input() events: ChartReleaseEvent[];

  constructor(
    private appLoaderService: AppLoaderService,
    private snackbar: SnackbarService,
    private redirect: RedirectService,
    private appService: ApplicationsService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
  ) {}

  portalName(name = 'web_portal'): string {
    return startCase(name);
  }

  portalLink(chart: ChartRelease, name = 'web_portal'): void {
    this.redirect.openWindow(chart.portals[name][0]);
  }

  updateButtonPressed(): void {
    const name = this.app.name;

    this.appLoaderService.open();
    this.appService.getChartUpgradeSummary(name).pipe(untilDestroyed(this)).subscribe({
      next: (summary: UpgradeSummary) => {
        this.appLoaderService.close();

        const dialogRef = this.matDialog.open(ChartUpgradeDialogComponent, {
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
            // this.refreshChartReleases();
          });
          jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
            this.dialogService.closeAllDialogs();
            new EntityUtils().handleWsError(this, error, this.dialogService);
          });
        });
      },
      error: (error) => {
        this.appLoaderService.close();
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  deleteButtonPressed(): void {
    this.snackbar.success('Delete App Pressed!');
  }
}
