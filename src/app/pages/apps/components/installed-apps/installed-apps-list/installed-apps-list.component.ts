import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe, Location } from '@angular/common';
import {
  Component, ChangeDetectionStrategy,
  output,
  input, OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatColumnDef } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ActivatedRoute, NavigationEnd, NavigationStart, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, filter, forkJoin, Observable, switchMap,
} from 'rxjs';
import { AppState } from 'app/enums/app-state.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
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
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
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
  selector: 'ix-installed-apps-list',
  templateUrl: './installed-apps-list.component.html',
  styleUrls: ['./installed-apps-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    InstalledAppsListBulkActionsComponent,
    FakeProgressBarComponent,
    SearchInput1Component,
    IxIconComponent,
    MatSort,
    AsyncPipe,
    MatCheckbox,
    MatColumnDef,
    MatSortHeader,
    AppRowComponent,
    EmptyComponent,
    MatTooltip,
    TestDirective,
    TranslateModule,
  ],
})

export class InstalledAppsListComponent implements OnInit {
  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();

  protected readonly searchableElements = installedAppsElements;
  readonly isLoading = toSignal(this.installedAppsStore.isLoading$, { requireSync: true });

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
    return this.checkedAppsNames.map((id) => this.dataSource.find((app) => app.id === id));
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

  constructor(
    private api: ApiService,
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
    private errorHandler: ErrorHandlerService,
    private store$: Store<WebuiAppState>,
    private location: Location,
    private appsStats: AppsStatsService,
    private loader: AppLoaderService,
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

  closeMobileDetails(): void {
    this.toggleShowMobileDetails.emit(false);
  }

  viewDetails(app: App): void {
    this.selectAppForDetails(app.id);

    this.router.navigate(['/apps/installed', app.metadata.train, app.id]);

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
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
          return this.matDialog.open<
            AppDeleteDialogComponent,
            AppDeleteDialogInputData,
            AppDeleteDialogOutputData
          >(AppDeleteDialogComponent, {
            data: {
              name: this.checkedAppsNames.join(', '),
              showRemoveVolumes: ixVolumesExist.some(Boolean),
            },
          }).afterClosed();
        }),
        filter(Boolean),
        switchMap((options) => this.executeBulkDeletion(options)),
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

  private executeBulkDeletion(options: AppDeleteDialogOutputData): Observable<Job<CoreBulkResponse[]>> {
    const bulkDeletePayload = this.checkedAppsNames.map((name) => [
      name,
      {
        remove_images: options.removeImages,
        remove_ix_volumes: options.removeVolumes,
        force_remove_ix_volumes: options.forceRemoveVolumes,
      },
    ]);

    return this.dialogService.jobDialog(
      this.api.job('core.bulk', ['app.delete', bulkDeletePayload]),
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
