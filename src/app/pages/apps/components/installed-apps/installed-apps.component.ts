import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  AfterViewInit,
  Inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRoute, NavigationEnd, NavigationStart, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, filter,
} from 'rxjs';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/apps/apps';
import { ChartScaleResult, ChartScaleQueryParams } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { KubernetesSettingsComponent } from 'app/pages/apps/components/installed-apps/kubernetes-settings/kubernetes-settings.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './installed-apps.component.html',
  styleUrls: ['./installed-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalledAppsComponent implements OnInit, AfterViewInit {
  dataSource: ChartRelease[] = [];
  selectedApp: ChartRelease;
  isLoading = false;
  filterString = '';
  showMobileDetails = false;
  isMobileView = false;
  appJobs = new Map<string, Job<ChartScaleResult, ChartScaleQueryParams>>();

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: helptext.message.loading,
  };

  get filteredApps(): ChartRelease[] {
    return this.dataSource
      .filter((app) => app?.name?.toLocaleLowerCase().includes(this.filterString.toLocaleLowerCase()));
  }

  get allAppsChecked(): boolean {
    return this.dataSource.every((app) => app.selected);
  }

  get hasCheckedApps(): boolean {
    return this.checkedAppsNames.length > 0;
  }

  get appsUpdateAvailable(): number {
    return this.dataSource
      .filter((app) => app.update_available || app.container_images_update_available).length;
  }

  get hasUpdates(): boolean {
    return this.dataSource.some((app) => app.update_available || app.container_images_update_available);
  }

  get checkedAppsNames(): string[] {
    return this.dataSource.filter((app) => app.selected).map((app) => app.name);
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

  get startedCheckedApps(): ChartRelease[] {
    return this.dataSource.filter((app) => app.status === ChartReleaseStatus.Active && app.selected);
  }

  get stoppedCheckedApps(): ChartRelease[] {
    return this.dataSource.filter((app) => app.status === ChartReleaseStatus.Stopped && app.selected);
  }

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private installedAppsStore: InstalledAppsStore,
    private kubernetesStore: KubernetesStore,
    private slideInService: IxSlideInService,
    private breakpointObserver: BreakpointObserver,
    @Inject(WINDOW) private window: Window,
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd),
        untilDestroyed(this),
      )
      .subscribe(() => {
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
          this.closeMobileDetails();
          this.selectedApp = undefined;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnInit(): void {
    this.loadChartReleases();
    this.listenForStatusUpdates();
    this.installedAppsStore.isLoading$.pipe(untilDestroyed(this)).subscribe({
      next: (isLoading) => {
        this.isLoading = isLoading;
        this.cdr.markForCheck();
      },
    });
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
        } else {
          this.closeMobileDetails();
          this.isMobileView = false;
        }
        this.cdr.markForCheck();
      });
  }

  trackAppBy(index: number, item: ChartRelease): string {
    return item.name;
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }

  viewDetails(app: ChartRelease): void {
    this.selectAppForDetails(app.id);

    if (this.isMobileView) {
      this.showMobileDetails = true;

      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  onSearch(query: string): void {
    this.filterString = query;

    if (!this.filteredApps.length) {
      this.showLoadStatus(EmptyType.NoSearchResults);
    }
  }

  toggleAppsChecked(checked: boolean): void {
    this.dataSource.forEach((app) => app.selected = checked);
  }

  showLoadStatus(type: EmptyType): void {
    switch (type) {
      case EmptyType.FirstUse:
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
      case EmptyType.NoSearchResults:
        this.entityEmptyConf.title = helptext.message.no_search_result;
        this.entityEmptyConf.message = undefined;
        this.entityEmptyConf.button = {
          label: this.translate.instant('Reset Search'),
          action: () => {
            this.resetSearch();
            this.cdr.markForCheck();
          },
        };
        break;
    }

    this.entityEmptyConf.type = type;
  }

  loadChartReleases(): void {
    this.cdr.markForCheck();

    combineLatest([
      this.kubernetesStore.selectedPool$,
      this.kubernetesStore.isKubernetesStarted$,
      this.installedAppsStore.installedApps$,
    ]).pipe(
      filter(([pool]) => {
        if (!pool) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.FirstUse);
          this.cdr.markForCheck();
        }
        return !!pool;
      }),
      filter(([,kubernetesStarted]) => {
        if (!kubernetesStarted) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
        }
        return !!kubernetesStarted;
      }),
      filter(([,,charts]) => {
        if (!charts.length) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
        }
        return !!charts.length;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: ([,,charts]) => {
        this.dataSource = charts;
        this.selectAppForDetails(this.activatedRoute.snapshot.paramMap.get('appId'));
        this.cdr.markForCheck();
      },
    });
  }

  start(name: string): void {
    this.appService.startApplication(name)
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<ChartScaleResult, ChartScaleQueryParams>) => {
        this.appJobs.set(name, job);
        this.cdr.markForCheck();
      });
  }

  stop(name: string): void {
    this.appService.stopApplication(name)
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<ChartScaleResult, ChartScaleQueryParams>) => {
        this.appJobs.set(name, job);
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
    this.stoppedCheckedApps.forEach((app) => this.start(app.name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkStop(): void {
    this.startedCheckedApps.forEach((app) => this.stop(app.name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkUpgrade(updateAll = false): void {
    const apps = this.dataSource
      .filter((app) => (updateAll ? app.update_available || app.container_images_update_available : app.selected));
    this.matDialog.open(AppBulkUpgradeComponent, { data: apps })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
        this.toggleAppsChecked(false);
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
      this.toggleAppsChecked(false);
      dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', checkedNames.map((item) => [item])]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
        (job: Job<CoreBulkResponse[]>) => {
          if (!this.dataSource.length) {
            this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
          }
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
        },
      );
    });
  }

  getAppStatus(name: string): AppStatus {
    const app = this.dataSource.find((installedApp) => installedApp.name === name);
    const job = this.appJobs.get(name);

    let status: AppStatus;

    switch (app.status) {
      case ChartReleaseStatus.Active:
        status = AppStatus.Started;
        break;
      case ChartReleaseStatus.Deploying:
        status = AppStatus.Deploying;
        break;
      case ChartReleaseStatus.Stopped:
        status = AppStatus.Stopped;
        break;
    }

    if (job) {
      const [, params] = job.arguments;
      if ([JobState.Waiting, JobState.Running].includes(job.state) && params.replica_count >= 1) {
        status = AppStatus.Starting;
      }
      if ([JobState.Waiting, JobState.Running].includes(job.state) && params.replica_count === 0) {
        status = AppStatus.Stopping;
      }
      if (
        job.state === JobState.Success &&
          params.replica_count >= 1 &&
          app.status !== ChartReleaseStatus.Deploying
      ) {
        status = AppStatus.Started;
      }
      if (
        job.state === JobState.Success &&
          params.replica_count === 0 &&
          app.status !== ChartReleaseStatus.Deploying
      ) {
        status = AppStatus.Stopped;
      }
    }
    return status;
  }

  private selectAppForDetails(appId: string): void {
    if (!this.dataSource.length) {
      return;
    }

    let app: ChartRelease;
    if (appId) {
      app = this.dataSource.find((chart) => chart.id === appId);
    }
    if (app) {
      this.selectedApp = app;
    } else {
      const [firstApp] = this.dataSource;
      if (firstApp.catalog && firstApp.catalog_train && firstApp.id) {
        this.router.navigate(['/apps', 'installed', firstApp.catalog, firstApp.catalog_train, firstApp.id]);
      } else {
        this.router.navigate(['/apps', 'installed']);
      }

      this.selectedApp = firstApp;
    }

    this.cdr.markForCheck();
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

  private listenForStatusUpdates(): void {
    this.appService
      .getInstalledAppsStatusUpdates()
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        const [name] = event.fields.arguments;
        this.appJobs.set(name, event.fields);
        this.cdr.markForCheck();
      });
  }
}
