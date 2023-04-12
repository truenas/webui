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
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ChartBulkUpgradeComponent } from 'app/pages/apps-old/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { KubernetesSettingsComponent } from 'app/pages/apps-old/kubernetes-settings/kubernetes-settings.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  appJobs = new Map<string, Job<ChartScaleResult, ChartScaleQueryParams>>();

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: helptext.message.loading,
  };

  emptySearchResultsConf: EmptyConfig = {
    type: EmptyType.NoSearchResults,
    title: helptext.message.no_search_result,
    button: {
      label: this.translate.instant('Reset Search'),
      action: () => {
        this.resetSearch();
        this.cdr.markForCheck();
      },
    },
  };

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
    private slideInService: IxSlideInService,
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

  get filteredApps(): ChartRelease[] {
    return this.dataSource
      .filter((app) => app.name.toLocaleLowerCase().includes(this.filterString.toLocaleLowerCase()));
  }

  get allAppsChecked(): boolean {
    return this.dataSource.every((app) => app.selected);
  }

  get hasCheckedApps(): boolean {
    return this.checkedAppsNames.length > 0;
  }

  get hasSelectionUpdates(): number {
    return this.checkedAppsNames
      .map((name) => this.dataSource.find((app) => app.name === name))
      .filter((app) => app.update_available || app.container_images_update_available).length;
  }

  get hasUpdates(): boolean {
    return this.dataSource.some((app) => app.update_available || app.container_images_update_available);
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

  get isBulkStartDisabled(): boolean {
    return this.dataSource.every((app) => [
      ChartReleaseStatus.Active,
      ChartReleaseStatus.Deploying,
    ].includes(app.status));
  }

  get isBulkStopDisabled(): boolean {
    return this.dataSource.every((app) => ChartReleaseStatus.Stopped === app.status);
  }

  get isBulkUpgradeDisabled(): boolean {
    return !this.checkedAppsNames
      .map((name) => this.dataSource.find((app) => app.name === name))
      .some((app) => app.update_available || app.container_images_update_available);
  }

  ngOnInit(): void {
    this.listenForRouteChanges();
    this.listenForSlideFormClosed();
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
  }

  showLoadStatus(type: EmptyType): void {
    switch (type) {
      case EmptyType.Loading:
        this.entityEmptyConf.title = helptext.message.loading;
        this.entityEmptyConf.message = undefined;
        this.entityEmptyConf.button = undefined;
        break;
      case EmptyType.FirstUse:
        this.entityEmptyConf.title = helptext.message.not_configured;
        this.entityEmptyConf.message = undefined;
        this.entityEmptyConf.button = undefined;
        // TODO: Button to check available apps or open advanced settings?
        break;
      case EmptyType.NoPageData:
        this.entityEmptyConf.title = helptext.message.no_installed;
        this.entityEmptyConf.message = this.translate.instant('Applications you install will automatically appear here. Click below and browse available apps to get started.');
        this.entityEmptyConf.button = {
          label: this.translate.instant('Check Available Apps'),
          action: () => this.redirectToAvailableApps(),
        };
        break;
      case EmptyType.Errors:
        this.entityEmptyConf.title = helptext.message.not_running;
        this.entityEmptyConf.message = undefined;
        this.entityEmptyConf.button = {
          label: this.translate.instant('Open Settings'),
          action: () => this.openAdvancedSettings(),
        };
        break;
    }

    this.entityEmptyConf.type = type;
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        map((params) => params.appId as string),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((appId) => {
        this.selectAppOnLoad(appId);
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
                this.selectAppOnLoad();
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

  refreshStatus(name: string): void {
    this.appService.getChartReleases(name)
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((releases) => {
        const item = this.dataSource.find((app) => app.name === name);
        if (item) {
          item.status = releases[0].status;
          this.cdr.markForCheck();
          if (item.status === ChartReleaseStatus.Deploying) {
            setTimeout(() => {
              this.refreshStatus(name);
              this.cdr.markForCheck();
            }, 3000);
          }
        }
      });
  }

  start(name: string): void {
    this.appService.startApplication(name)
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<ChartScaleResult, ChartScaleQueryParams>) => {
        this.appJobs.set(name, job);
        if (job.state === JobState.Success) {
          const startedApp = this.dataSource.find((app) => app.name === name);
          if (startedApp) {
            startedApp.status = ChartReleaseStatus.Active;
          }
        }
        this.cdr.markForCheck();
      });
  }

  stop(name: string): void {
    this.appService.stopApplication(name)
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<ChartScaleResult, ChartScaleQueryParams>) => {
        this.appJobs.set(name, job);
        if (job.state === JobState.Success) {
          const stoppedApp = this.dataSource.find((app) => app.name === name);
          if (stoppedApp) {
            stoppedApp.status = ChartReleaseStatus.Stopped;
          }
        }
        this.cdr.markForCheck();
      });
  }

  openStatusDialog(name: string): void {
    if (!this.appJobs.has(name)) {
      return;
    }

    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: name } });
    dialogRef.componentInstance.jobId = this.appJobs.get(name).id;
    dialogRef.componentInstance.wsshow();
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

  private selectAppOnLoad(appId?: string): void {
    if (!this.dataSource.length) {
      return;
    }

    const app = this.dataSource.find((chart) => chart.id === appId);
    if (app) {
      this.selectApp(app);
    } else {
      this.selectApp(this.dataSource[0]);
    }

    this.cdr.markForCheck();
  }

  private listenForSlideFormClosed(): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateChartReleases();
    });
  }

  private openAdvancedSettings(): void {
    this.slideInService.open(KubernetesSettingsComponent);
  }

  private resetSearch(): void {
    this.onSearch('');
  }

  private redirectToAvailableApps(): void {
    this.router.navigate(['/apps', 'available']);
  }
}
