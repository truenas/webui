import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe, Location } from '@angular/common';
import { Component, ChangeDetectionStrategy, output, OnInit, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatColumnDef } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ActivatedRoute, Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, debounceTime, filter, forkJoin, map, Observable, of, shareReplay, switchMap,
} from 'rxjs';
import { installedAppsEmptyConfig } from 'app/constants/empty-configs';
import { AppState } from 'app/enums/app-state.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';
import { AppBulkUpdateComponent } from 'app/pages/apps/components/installed-apps/app-bulk-update/app-bulk-update.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { isExternalApp, isTruenasApp } from 'app/pages/apps/utils/app-type.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState as WebuiAppState } from 'app/store';

enum SortableField {
  Application = 'application',
  State = 'state',
  Updates = 'updates',
}

function doSortCompare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'ix-installed-apps-list',
  templateUrl: './installed-apps-list.component.html',
  styleUrls: ['./installed-apps-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InstalledAppsListBulkActionsComponent,
    FakeProgressBarComponent,
    BasicSearchComponent,
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
    FileSizePipe,
    NetworkSpeedPipe,
  ],
})

export class InstalledAppsListComponent implements OnInit {
  private api = inject(ApiService);
  private appService = inject(ApplicationsService);
  private cdr = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private installedAppsStore = inject(InstalledAppsStore);
  private dockerStore = inject(DockerStore);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<WebuiAppState>>(Store);
  private location = inject(Location);
  private appsStats = inject(AppsStatsService);
  private loader = inject(LoaderService);
  private layoutService = inject(LayoutService);
  private destroyRef = inject(DestroyRef);

  readonly appId = toSignal<string | undefined>(this.activatedRoute.params.pipe(map((params) => params['appId'])));
  readonly toggleShowMobileDetails = output<boolean>();

  protected readonly searchableElements = installedAppsElements;
  readonly isLoading = toSignal(this.installedAppsStore.isLoading$, { requireSync: true });

  dataSource: App[] = [];
  selectedApp: App | undefined;
  searchQuery = signal('');
  appJobs = new Map<string, Job<void, AppStartQueryParams>>();
  selection = new SelectionModel<string>(true, []);
  sortingInfo: Sort = {
    active: SortableField.Application,
    direction: SortDirection.Asc,
  };

  truenasAppsExpanded = signal(true);
  externalAppsExpanded = signal(true);

  readonly sortableField = SortableField;

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant(helptextApps.message.loading),
  };

  get isSelectedAppVisible(): boolean {
    return this.filteredApps?.some((app) => app.id === this.selectedApp?.id);
  }

  get filteredApps(): App[] {
    return this.dataSource
      .filter((app) => app?.name?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase()));
  }

  get filteredTruenasApps(): App[] {
    return this.filteredApps.filter((app) => isTruenasApp(app));
  }

  get filteredExternalApps(): App[] {
    return this.filteredApps.filter((app) => isExternalApp(app));
  }

  get allAppsChecked(): boolean {
    return this.selection.selected.length === this.filteredTruenasApps.length && this.filteredTruenasApps.length > 0;
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
    return this.checkedAppsNames
      .map((id) => this.dataSource.find((app) => app.id === id))
      .filter((app): app is App => !!app && isTruenasApp(app));
  }

  get activeCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state)
        && this.selection.isSelected(app.id)
        && isTruenasApp(app),
    );
  }

  get stoppedCheckedApps(): App[] {
    return this.dataSource.filter(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state)
        && this.selection.isSelected(app.id)
        && isTruenasApp(app),
    );
  }

  ngOnInit(): void {
    this.loadInstalledApps();
    this.listenForStatusUpdates();
  }

  viewDetails(app: App): void {
    this.layoutService.navigatePreservingScroll(this.router, ['/apps/installed', app.metadata.train, app.id]);

    this.selectAppForDetails(app.id);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);

    if (!this.filteredApps.length) {
      this.showLoadStatus(EmptyType.NoSearchResults);
    }
  }

  toggleAppsChecked(checked: boolean): void {
    if (checked) {
      this.filteredTruenasApps.forEach((app) => this.selection.select(app.id));
    } else {
      this.selection.clear();
    }
  }

  private showLoadStatus(
    type: EmptyType.FirstUse | EmptyType.NoPageData | EmptyType.Errors | EmptyType.NoSearchResults,
  ): void {
    switch (type) {
      case EmptyType.FirstUse:
      case EmptyType.NoPageData:
        this.entityEmptyConf = { ...installedAppsEmptyConfig };
        this.entityEmptyConf.button = {
          label: this.translate.instant('Check Available Apps'),
          action: () => this.redirectToAvailableApps(),
        };
        break;
      case EmptyType.Errors:
        this.entityEmptyConf.title = this.translate.instant(helptextApps.message.notRunning);
        this.entityEmptyConf.message = undefined;
        break;
      case EmptyType.NoSearchResults:
        this.entityEmptyConf.title = this.translate.instant(helptextApps.message.noSearchResults);
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

  private loadInstalledApps(): void {
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
          this.redirectToInstalledApps();
        }
        return !!pool;
      }),
      filter(([,dockerStarted]) => {
        if (!dockerStarted) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!dockerStarted;
      }),
      filter(([,, apps]) => {
        if (!apps.length) {
          this.dataSource = [];
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!apps.length;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([,, apps]) => {
        this.setDatasourceWithSort(this.sortingInfo, apps);
        this.selectAppForDetails(this.appId());
        this.cdr.markForCheck();
      },
    });
  }

  start(name: string): void {
    this.appService.startApplication(name)
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.setDatasourceWithSort(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  stop(name: string): void {
    this.appService.stopApplication(name)
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (job: Job<void, AppStartQueryParams>) => {
          this.appJobs.set(name, job);
          this.setDatasourceWithSort(this.sortingInfo);
          this.cdr.markForCheck();
        },
      });
  }

  restart(name: string): void {
    this.appService.restartApplication(name)
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.setDatasourceWithSort(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  openStatusDialog(name: string): void {
    const jobId = this.appJobs.get(name)?.id;
    if (!jobId) {
      return;
    }
    const job$ = this.store$.select(selectJob(jobId)).pipe(filter((job) => !!job));
    this.dialogService.jobDialog(job$, { title: ignoreTranslation(name), canMinimize: true })
      .afterClosed()
      .pipe(this.errorHandler.withErrorHandler(), takeUntilDestroyed(this.destroyRef))
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

  onBulkUpdate(updateAll = false): void {
    const apps = this.dataSource.filter((app) => (
      updateAll ? app.upgrade_available : this.selection.isSelected(app.id)
    ));
    this.matDialog.open(AppBulkUpdateComponent, { data: apps })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
            AppDeleteDialog,
            AppDeleteDialogInputData,
            AppDeleteDialogOutputData
          >(AppDeleteDialog, {
            data: {
              name: this.checkedAppsNames.join(', '),
              showRemoveVolumes: ixVolumesExist.some(Boolean),
            },
          }).afterClosed();
        }),
        filter(Boolean),
        switchMap((options) => this.executeBulkDeletion(options)),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<CoreBulkResponse[]>) => this.handleDeletionResult(job));
  }

  /**
   * Sorts the dataSource array by the specified field and direction.
   *
   * Sorting Strategy:
   * - Sorts by Application name, State, or Updates availability
   * - Both TrueNAS and External apps are sorted together in a single operation
   * - This ensures consistent alphabetical/state ordering across all apps
   *
   * Template Rendering:
   * - The template splits this sorted array into separate sections via
   *   filteredTruenasApps and filteredExternalApps getters
   * - Each section preserves the sort order from this unified sort
   * - Example: If sorted A-Z, both sections will be alphabetically ordered
   */
  setDatasourceWithSort(sort: Sort, apps?: App[]): void {
    this.sortingInfo = sort;
    const sourceArray = apps && apps.length > 0 ? apps : this.dataSource;
    this.dataSource = [...sourceArray].sort((a, b) => {
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
      { title: this.translate.instant(helptextApps.apps.deleting) },
    ).afterClosed();
  }

  private handleDeletionResult(job: Job<CoreBulkResponse[]>): void {
    if (!this.dataSource.length) {
      this.redirectToInstalledApps();
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

  private selectAppForDetails(appId: string | null): void {
    if (!this.dataSource.length) {
      return;
    }

    const selectedApp = appId && this.dataSource.find((app) => app.id === appId);
    if (selectedApp) {
      this.selectedApp = selectedApp;
      this.toggleShowMobileDetails.emit(true);
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
    this.onListFiltered('');
  }

  private redirectToInstalledApps(): void {
    this.router.navigate(['/apps', 'installed']);
  }

  private redirectToAvailableApps(): void {
    this.router.navigate(['/apps', 'available']);
  }

  private listenForStatusUpdates(): void {
    this.appService
      .getInstalledAppsStatusUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const [name] = event.fields.arguments;
        this.appJobs.set(name, event.fields);
        this.setDatasourceWithSort(this.sortingInfo);
        this.cdr.markForCheck();
      });
  }

  getAppStats(name: string): Observable<AppStats> {
    return this.appsStats.getStatsForApp(name);
  }

  private safeAdd(a: number, b: number | null | undefined): number {
    const numA = typeof a === 'number' && !Number.isNaN(a) ? a : 0;
    const numB = typeof b === 'number' && !Number.isNaN(b) ? b : 0;
    return numA + numB;
  }

  private safeNetworkSum(networks: { rx_bytes?: number; tx_bytes?: number }[] | null | undefined, field: 'rx_bytes' | 'tx_bytes'): number {
    if (!Array.isArray(networks) || networks.length === 0) {
      return 0;
    }
    return networks.reduce((sum, net) => {
      const value = net?.[field];
      return this.safeAdd(sum, value);
    }, 0);
  }

  readonly totalUtilization$ = this.installedAppsStore.installedApps$.pipe(
    debounceTime(300),
    switchMap((apps) => {
      // Check if apps array is empty or contains only null/undefined values
      if (!apps?.length || !apps.some((app) => !!app)) {
        return of({
          cpu: 0,
          memory: 0,
          blkioRead: 0,
          blkioWrite: 0,
          networkRx: 0,
          networkTx: 0,
        });
      }

      return combineLatest(
        apps.map((app) => this.getAppStats(app.name)),
      ).pipe(
        map((statsArray) => {
          return statsArray.reduce((totals, stats) => {
            // Return early if stats is null/undefined or doesn't have expected shape
            if (!stats || typeof stats !== 'object') {
              return totals;
            }

            return {
              cpu: this.safeAdd(totals.cpu, stats.cpu_usage),
              memory: this.safeAdd(totals.memory, stats.memory),
              blkioRead: this.safeAdd(totals.blkioRead, stats.blkio?.read),
              blkioWrite: this.safeAdd(totals.blkioWrite, stats.blkio?.write),
              networkRx: this.safeAdd(totals.networkRx, this.safeNetworkSum(stats.networks, 'rx_bytes')),
              networkTx: this.safeAdd(totals.networkTx, this.safeNetworkSum(stats.networks, 'tx_bytes')),
            };
          }, {
            cpu: 0,
            memory: 0,
            blkioRead: 0,
            blkioWrite: 0,
            networkRx: 0,
            networkTx: 0,
          });
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
    takeUntilDestroyed(this.destroyRef),
  );
}
