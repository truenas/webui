import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, TemplateRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import helptext from 'app/helptext/apps/apps';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ChartBulkUpgradeComponent } from 'app/pages/apps-old/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './installed-apps.component.html',
  styleUrls: ['./installed-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalledAppsComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  dataSource: ChartRelease[] = [];
  selectedApp: ChartRelease;
  isLoading = false;
  filterString = '';
  title = '';

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private layoutService: LayoutService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
      });
  }

  get allAppsChecked(): boolean {
    return this.dataSource.every((app) => app.selected);
  }

  get isSomethingChecked(): boolean {
    return this.checkedAppsNames.length > 0;
  }

  get hasUpdates(): boolean {
    if (this.dataSource.length === 0) {
      return false;
    }

    return this.checkedAppsNames
      .map((name) => this.dataSource.find((app) => app.name === name))
      .some((app) => app.update_available || app.container_images_update_available);
  }

  get checkedAppsNames(): string[] {
    const selectedItems: string[] = [];
    this.dataSource.forEach((element) => {
      if (element.selected) {
        selectedItems.push(element.name);
      }
    });
    return selectedItems;
  }

  ngOnInit(): void {
    this.listenForRouteChanges();
    this.updateChartReleases();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onSearch(query: string): void {
    this.filterString = query;
  }

  toggleAppsChecked(checked: boolean): void {
    this.dataSource.forEach((app) => app.selected = checked);
  }

  selectApp(app: ChartRelease): void {
    this.selectedApp = app;
    this.cdr.markForCheck();
  }

  showLoadStatus(type: EmptyType): void {
    let title = '';

    switch (type) {
      case EmptyType.Loading:
        title = helptext.message.loading;
        break;
      case EmptyType.FirstUse:
        title = helptext.message.not_configured;
        break;
      case EmptyType.NoSearchResults:
        title = helptext.message.no_search_result;
        break;
      case EmptyType.NoPageData:
        title = helptext.message.no_installed;
        break;
      case EmptyType.Errors:
        title = helptext.message.not_running;
        break;
    }

    this.title = title;
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        map((params) => params.appId as string),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((appId) => {
        const app = this.dataSource.find((chart) => chart.id === appId);
        if (app) {
          this.selectApp(app);
          this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
        }
      });
  }

  updateChartReleases(): void {
    this.isLoading = true;
    this.showLoadStatus(EmptyType.Loading);
    this.cdr.markForCheck();
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.dataSource = [];
        this.showLoadStatus(EmptyType.FirstUse);
        this.isLoading = false;
        this.cdr.markForCheck();
      } else {
        this.appService.getKubernetesServiceStarted().pipe(untilDestroyed(this)).subscribe((kubernetesStarted) => {
          if (!kubernetesStarted) {
            this.dataSource = [];
            this.showLoadStatus(EmptyType.Errors);
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.appService.getChartReleases().pipe(untilDestroyed(this)).subscribe((charts) => {
              if (charts.length) {
                this.dataSource = charts;
                this.dataSource.forEach((app) => {
                  if (app.status === ChartReleaseStatus.Deploying) {
                    this.refreshStatus(app.name);
                  }
                });
              } else {
                this.dataSource = [];
                this.showLoadStatus(EmptyType.NoPageData);
              }
              this.isLoading = false;
              this.cdr.markForCheck();
            });
          }
        });
      }
    });
  }

  syncAll(): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.refreshing },
    });
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.updateChartReleases();
    });
  }

  refreshStatus(name: string): void {
    this.appService.getChartReleases(name).pipe(filter(Boolean), untilDestroyed(this)).subscribe((releases) => {
      const item = this.dataSource.find((app) => app.name === name);
      if (item) {
        item.status = releases[0].status;
        this.cdr.markForCheck();
        if (item.status === ChartReleaseStatus.Deploying) {
          setTimeout(() => this.refreshStatus(name), 3000);
        }
      }
    });
  }

  start(name: string): void {
    this.changeReplicaCountJob(name, helptext.starting, 1);
  }

  stop(name: string): void {
    this.changeReplicaCountJob(name, helptext.stopping, 0);
  }

  changeReplicaCountJob(chartName: string, title: string, newReplicaCount: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title } });
    dialogRef.componentInstance.setCall('chart.release.scale', [chartName, { replica_count: newReplicaCount }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshStatus(chartName);
      dialogRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.dialogService.error(this.errorHandler.parseJobError(error));
    });
  }

  onBulkStart(): void {
    const checkedNames = this.checkedAppsNames;
    checkedNames.forEach((name) => this.start(name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
  }

  onBulkStop(): void {
    const checkedNames = this.checkedAppsNames;
    checkedNames.forEach((name) => this.stop(name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
  }

  onBulkUpgrade(): void {
    const apps = this.dataSource.filter((app) => app.selected);
    const dialogRef = this.matDialog.open(ChartBulkUpgradeComponent, { data: apps });

    dialogRef.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.updateChartReleases();
    });
  }

  onBulkDelete(): void {
    const checkedNames = this.checkedAppsNames;
    const name = checkedNames.join(', ');
    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const dialogRef = this.matDialog.open(EntityJobComponent, {
        data: {
          title: helptext.charts.delete_dialog.job,
        },
      });
      dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', checkedNames.map((item) => [item])]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
        (job: Job<CoreBulkResponse[]>) => {
          this.dialogService.closeAllDialogs();
          let message = '';
          job.result.forEach((item) => {
            if (item.error !== null) {
              message = message + '<li>' + item.error + '</li>';
            }
          });

          if (message !== '') {
            message = '<ul>' + message + '</ul>';
            this.dialogService.error({ title: helptext.bulkActions.title, message });
          }
          this.updateChartReleases();
        },
      );
    });
  }
}
