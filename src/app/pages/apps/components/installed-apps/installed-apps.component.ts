import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, Location } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  AfterViewInit,
  Inject, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatColumnDef } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ActivatedRoute, NavigationEnd, NavigationStart, Router,
  RouterLink,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, filter,
  forkJoin,
  Observable,
  switchMap,
} from 'rxjs';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
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
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { DockerStatusComponent } from 'app/pages/apps/components/installed-apps/docker-status/docker-status.component';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState as WebuiAppState } from 'app/store';

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
  standalone: true,
  imports: [
    TranslateModule,
    PageHeaderComponent,
    DockerStatusComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    IxIconComponent,
    AppSettingsButtonComponent,
    RouterLink,
    MatAnchor,
    UiSearchDirective,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    FakeProgressBarComponent,
    SearchInput1Component,
    MatSort,
    AsyncPipe,
    MatCheckbox,
    MatColumnDef,
    MatSortHeader,
    AppRowComponent,
    EmptyComponent,
    MatTooltip,
    DetailsHeightDirective,
    AppDetailsPanelComponent,
  ],
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

  get checkedApps(): App[] {
    return this.checkedAppsNames.map((name) => this.dataSource.find((app) => app.name === name));
  }

  get isBulkStartDisabled(): boolean {
    return this.checkedApps.every(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state),
    );
  }

  get isBulkStopDisabled(): boolean {
    return this.checkedApps.every(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state),
    );
  }

  get isBulkUpgradeDisabled(): boolean {
    return !this.checkedApps.some((app) => app.upgrade_available);
  }

  get activeCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state) && this.selection.isSelected(app.id),
    );
  }

  get stoppedCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state) && this.selection.isSelected(app.id),
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
    private store$: Store<WebuiAppState>,
    private location: Location,
    private appsStats: AppsStatsService,
    private loader: AppLoaderService,
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

  showLoadStatus(type: EmptyType.FirstUse | EmptyType.NoPageData | EmptyType.Errors | EmptyType.NoSearchResults): void {
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
          this.redirectToInstalledAppsWithoutDetails();
        }
        return !!pool;
      }),
      filter(([,dockerStarted]) => {
        if (!dockerStarted) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
          this.redirectToInstalledAppsWithoutDetails();
        }
        return !!dockerStarted;
      }),
      filter(([,, apps]) => {
        if (!apps.length) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
          this.redirectToInstalledAppsWithoutDetails();
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
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.sortChanged(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  stop(name: string): void {
    this.appService.stopApplication(name)
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        next: (job: Job<void, AppStartQueryParams>) => {
          this.appJobs.set(name, job);
          this.sortChanged(this.sortingInfo);
          this.cdr.markForCheck();
        },
      });
  }

  restart(name: string): void {
    this.appService.restartApplication(name)
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
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
    this.activeCheckedApps.forEach((app) => this.stop(app.name));
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
    forkJoin(this.checkedAppsNames.map((appName) => this.appService.checkIfAppIxVolumeExists(appName)))
      .pipe(
        this.loader.withLoader(),
        switchMap((ixVolumesExist) => {
          return this.dialogService.confirm({
            title: helptextApps.apps.delete_dialog.title,
            message: this.translate.instant('Delete {name}?', { name: this.checkedAppsNames.join(', ') }),
            secondaryCheckbox: ixVolumesExist.some(Boolean),
            secondaryCheckboxText: this.translate.instant('Remove iXVolumes'),
          });
        }),
        filter(({ confirmed }) => confirmed),
        switchMap(({ secondaryCheckbox }) => this.executeBulkDeletion(secondaryCheckbox)),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job: Job<CoreBulkResponse[]>) => this.handleDeletionResult(job));
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

  private executeBulkDeletion(removeIxVolumes = false): Observable<Job<CoreBulkResponse[]>> {
    const bulkDeletePayload = this.checkedAppsNames.map((name) => [
      name,
      { remove_images: true, remove_ix_volumes: removeIxVolumes },
    ]);

    return this.dialogService.jobDialog(
      this.ws.job('core.bulk', ['app.delete', bulkDeletePayload]),
      { title: helptextApps.apps.delete_dialog.job },
    ).afterClosed();
  }

  private handleDeletionResult(job: Job<CoreBulkResponse[]>): void {
    if (!this.dataSource.length) {
      this.redirectToInstalledAppsWithoutDetails();
    }

    this.dialogService.closeAllDialogs();
    const errorMessages = this.getErrorMessages(job.result);

    if (errorMessages) {
      this.dialogService.error({ title: helptextApps.bulkActions.title, message: errorMessages });
    }

    this.toggleAppsChecked(false);
  }

  private getErrorMessages(results: CoreBulkResponse[]): string {
    const errors = results.filter((item) => item.error).map((item) => `<li>${item.error}</li>`);

    return errors.length ? `<ul>${errors.join('')}</ul>` : '';
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

  private redirectToInstalledAppsWithoutDetails(): void {
    this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
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
