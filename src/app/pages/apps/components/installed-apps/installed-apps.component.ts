import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  AfterViewInit,
  Inject, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import {
  ActivatedRoute, NavigationEnd, NavigationStart, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, filter,
  Observable,
} from 'rxjs';
import { AppState } from 'app/enums/app-state.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextApps } from 'app/helptext/apps/apps';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppsState } from 'app/store';

enum SortableField {
  Application = 'application',
  State = 'state',
  Updates = 'updates',
}

function doSortCompare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@UntilDestroy()
@Component({
  selector: 'ix-installed-apps',
  templateUrl: './installed-apps.component.html',
  styleUrls: ['./installed-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalledAppsComponent implements OnInit, AfterViewInit {
  protected readonly searchableElements = installedAppsElements;

  readonly isLoading = toSignal(this.installedAppsStore.isLoading$, { requireSync: true });

  readonly isMobileView = signal(false);
  readonly showMobileDetails = signal(false);

  dataSource: App[] = [];
  selectedApp: App;
  filterString = '';
  appJobs = new Map<string, Job<void, AppStartQueryParams>>();
  selection = new SelectionModel<string>(true, []);
  sortingInfo: Sort = {
    active: SortableField.Application,
    direction: SortDirection.Asc,
  };
  readonly sortableField = SortableField;

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: helptextApps.message.loading,
  };

  get filteredApps(): App[] {
    return this.dataSource
      .filter((app) => app?.name?.toLocaleLowerCase().includes(this.filterString.toLocaleLowerCase()));
  }

  get allAppsChecked(): boolean {
    return this.selection.selected.length === this.filteredApps.length;
  }

  get hasCheckedApps(): boolean {
    return this.checkedAppsNames.length > 0;
  }

  get appsUpdateAvailable(): number {
    return this.dataSource
      .filter((app) => app.upgrade_available).length;
  }

  get hasUpdates(): boolean {
    return this.dataSource.some((app) => app.upgrade_available);
  }

  get checkedAppsNames(): string[] {
    return this.selection.selected;
  }

  get isBulkStartDisabled(): boolean {
    return this.dataSource.every((app) => [
      AppState.Running,
      AppState.Deploying,
    ].includes(app.state));
  }

  get isBulkStopDisabled(): boolean {
    return this.dataSource.every((app) => AppState.Stopped === app.state);
  }

  get isBulkUpgradeDisabled(): boolean {
    return !this.checkedAppsNames
      .map((name) => this.dataSource.find((app) => app.name === name))
      .some((app) => app.upgrade_available);
  }

  get startedCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => app.state === AppState.Running && this.selection.isSelected(app.id),
    );
  }

  get stoppedCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => app.state === AppState.Stopped && this.selection.isSelected(app.id),
    );
  }

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private ws: WebSocketService,
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private installedAppsStore: InstalledAppsStore,
    private dockerStore: DockerStore,
    private breakpointObserver: BreakpointObserver,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppsState>,
    private location: Location,
    private appsStats: AppsStatsService,
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
    this.loadInstalledApps();
    this.listenForStatusUpdates();
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView.set(true);
        } else {
          this.isMobileView.set(false);
          this.closeMobileDetails();
        }
        this.cdr.markForCheck();
      });
  }

  closeMobileDetails(): void {
    this.showMobileDetails.set(false);
  }

  viewDetails(app: App): void {
    this.selectAppForDetails(app.id);

    this.router.navigate(['/apps/installed', app.metadata.train, app.id]);

    if (this.isMobileView()) {
      this.showMobileDetails.set(true);

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
    if (checked) {
      this.dataSource.forEach((app) => this.selection.select(app.id));
    } else {
      this.selection.clear();
    }
  }

  showLoadStatus(type: EmptyType): void {
    switch (type) {
      case EmptyType.FirstUse:
      case EmptyType.NoPageData:
        this.entityEmptyConf.title = helptextApps.message.no_installed;
        this.entityEmptyConf.message = this.translate.instant('Applications you install will automatically appear here. Click below and browse available apps to get started.');
        this.entityEmptyConf.button = {
          label: this.translate.instant('Check Available Apps'),
          action: () => this.redirectToAvailableApps(),
        };
        break;
      case EmptyType.Errors:
        this.entityEmptyConf.title = helptextApps.message.not_running;
        this.entityEmptyConf.message = undefined;
        break;
      case EmptyType.NoSearchResults:
        this.entityEmptyConf.title = helptextApps.message.no_search_result;
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

  loadInstalledApps(): void {
    this.cdr.markForCheck();

    combineLatest([
      this.dockerStore.selectedPool$,
      this.dockerStore.isDockerStarted$,
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
      filter(([,dockerStarted]) => {
        if (!dockerStarted) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
        }
        return !!dockerStarted;
      }),
      filter(([,, apps]) => {
        if (!apps.length) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
        }
        return !!apps.length;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: ([,, apps]) => {
        this.sortChanged(this.sortingInfo, apps);
        this.selectAppForDetails(this.activatedRoute.snapshot.paramMap.get('appId'));
        this.cdr.markForCheck();
      },
    });
  }

  start(name: string): void {
    this.appService.startApplication(name)
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.sortChanged(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  stop(name: string): void {
    this.appService.stopApplication(name)
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.sortChanged(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  openStatusDialog(name: string): void {
    if (!this.appJobs.has(name)) {
      return;
    }
    const job$ = this.store$.select(selectJob(this.appJobs.get(name).id));
    this.dialogService.jobDialog(job$, { title: name, canMinimize: true })
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  onBulkStart(): void {
    this.stoppedCheckedApps.forEach((app) => this.start(app.name));
    this.snackbar.success(this.translate.instant(helptextApps.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkStop(): void {
    this.startedCheckedApps.forEach((app) => this.stop(app.name));
    this.snackbar.success(this.translate.instant(helptextApps.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkUpgrade(updateAll = false): void {
    const apps = this.dataSource.filter((app) => (
      updateAll ? app.upgrade_available : this.selection.isSelected(app.id)
    ));
    this.matDialog.open(AppBulkUpgradeComponent, { data: apps })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.toggleAppsChecked(false);
      });
  }

  onBulkDelete(): void {
    const checkedNames = this.checkedAppsNames;
    const name = checkedNames.join(', ');
    this.dialogService.confirm({
      title: helptextApps.apps.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.dialogService.jobDialog(
          this.ws.job('core.bulk', ['app.delete', checkedNames.map((item) => [item])]),
          { title: helptextApps.apps.delete_dialog.job },
        )
          .afterClosed()
          .pipe(this.errorHandler.catchError(), untilDestroyed(this))
          .subscribe((job: Job<CoreBulkResponse[]>) => {
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
              this.dialogService.error({ title: helptextApps.bulkActions.title, message });
            }
          });
        this.toggleAppsChecked(false);
      });
  }

  sortChanged(sort: Sort, apps?: App[]): void {
    this.sortingInfo = sort;

    this.dataSource = (apps || this.dataSource).sort((a, b) => {
      const isAsc = sort.direction === SortDirection.Asc;

      switch (sort.active as SortableField) {
        case SortableField.Application:
          return doSortCompare(a.name, b.name, isAsc);
        case SortableField.State:
          return doSortCompare(a.state, b.state, isAsc);
        case SortableField.Updates:
          return doSortCompare(
            a.upgrade_available ? 1 : 0,
            b.upgrade_available ? 1 : 0,
            isAsc,
          );
        default:
          return doSortCompare(a.name, b.name, isAsc);
      }
    });
  }

  private selectAppForDetails(appId: string): void {
    if (!this.dataSource.length) {
      return;
    }

    const selectedApp = appId && this.dataSource.find((app) => app.id === appId);
    if (selectedApp) {
      this.selectedApp = selectedApp;
      this.cdr.markForCheck();
      return;
    }

    this.selectFirstApp();
  }

  private selectFirstApp(): void {
    const [firstApp] = this.dataSource;
    if (firstApp.metadata.train && firstApp.id) {
      this.location.replaceState(['/apps', 'installed', firstApp.metadata.train, firstApp.id].join('/'));
    } else {
      this.location.replaceState(['/apps', 'installed'].join('/'));
    }

    this.selectedApp = firstApp;
    this.cdr.markForCheck();
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
        this.sortChanged(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  getAppStats(name: string): Observable<AppStats> {
    return this.appsStats.getStatsForApp(name);
  }
}
