import { AsyncPipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef,
  inject, OnInit, output, signal, viewChild,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute, Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconComponent, TnTooltipDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnIconButtonComponent,
  TnSortEvent, TnTableColumnDirective, TnTableComponent } from '@truenas/ui-components';
import { ImgFallbackModule } from 'ngx-img-fallback';
import {
  combineLatest, filter, forkJoin, map, Observable, shareReplay, switchMap,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { installedAppsEmptyConfig } from 'app/constants/empty-configs';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData, AppDeleteDialogOutputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';
import { AppActionRequiredBadgeComponent } from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';
import { AppBulkUpdateComponent } from 'app/pages/apps/components/installed-apps/app-bulk-update/app-bulk-update.component';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { InstalledAppsListBulkActionsComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list-bulk-actions/installed-apps-list-bulk-actions.component';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/installed-apps.constants';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { AppsSort, InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
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
    TnIconComponent,
    TnTooltipDirective,
    AsyncPipe,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    RequiresRolesDirective,
    ImgFallbackModule,
    AppStateCellComponent,
    AppUpdateCellComponent,
    AppActionRequiredBadgeComponent,
    FileSizePipe,
    NetworkSpeedPipe,
    EmptyComponent,
    TranslateModule,
  ],
})

export class InstalledAppsListComponent implements OnInit {
  private api = inject(ApiService);
  private appService = inject(ApplicationsService);
  private cdr = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private tnDialog = inject(TnDialog);
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
  private destroyRef = inject(DestroyRef);
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  readonly appId = toSignal<string | undefined>(this.activatedRoute.params.pipe(map((params) => params['appId'])));
  readonly toggleShowMobileDetails = output<boolean>();

  protected readonly searchableElements = installedAppsElements;
  readonly isLoading = toSignal(this.installedAppsStore.isLoading$, { requireSync: true });

  readonly dataSource = signal<App[]>([]);
  selectedApp: App | undefined;
  searchQuery = toSignal(this.installedAppsStore.searchQuery$, { requireSync: true });
  appJobs = new Map<string, Job<void, AppStartQueryParams>>();
  checkedApps: App[] = [];
  sortingInfo = toSignal(this.installedAppsStore.sortingInfo$, { requireSync: true });

  protected readonly table = viewChild(TnTableComponent);

  readonly sortableField = SortableField;
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly trackByAppId = (_: number, app: App): string => app.id;

  protected readonly displayedColumns = [
    SortableField.Application,
    SortableField.State,
    'cpu',
    'ram',
    'io',
    'network',
    SortableField.Updates,
    'controls',
  ];

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant(helptextApps.message.loading),
  };

  get isSelectedAppVisible(): boolean {
    return this.filteredApps().some((app) => app.id === this.selectedApp?.id);
  }

  readonly filteredApps = computed(() => {
    const query = this.searchQuery();
    return this.dataSource()
      .filter((app) => app?.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  });

  get hasCheckedApps(): boolean {
    return this.checkedApps.length > 0;
  }

  get appsUpdateAvailable(): number {
    return this.dataSource()
      .filter((app) => app.upgrade_available).length;
  }

  get hasUpdates(): boolean {
    return this.dataSource().some((app) => app.upgrade_available);
  }

  get checkedAppsNames(): string[] {
    return this.checkedApps.map((app) => app.id);
  }

  get activeCheckedApps(): App[] {
    return this.checkedApps.filter(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state),
    );
  }

  get stoppedCheckedApps(): App[] {
    return this.checkedApps.filter(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state),
    );
  }

  ngOnInit(): void {
    this.loadInstalledApps();
    this.listenForStatusUpdates();
  }

  protected onSelectionChange(apps: App[]): void {
    this.checkedApps = apps;
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.setDatasourceWithSort({ active: event.column, direction: event.direction });
    this.cdr.markForCheck();
  }

  private clearSelection(): void {
    // selection.clear() resets the table's own SelectionModel without emitting
    // (selectionChange) (that output only fires on user interaction), so mirror
    // the cleared state into checkedApps ourselves. Matches docker-images-list.
    this.table()?.selection.clear();
    this.checkedApps = [];
    this.cdr.markForCheck();
  }

  protected isAppStopped(app: App): boolean {
    return app.state === AppState.Stopped || app.state === AppState.Crashed;
  }

  protected hasStats(app: App, stats: AppStats | null | undefined): stats is AppStats {
    return app.state === AppState.Running && !!stats;
  }

  protected inProgress(app: App): boolean {
    return app.state === AppState.Deploying;
  }

  protected incomingTrafficBits(stats: AppStats): number {
    return stats.networks.reduce((sum, networkStats) => sum + this.bytesToBits(networkStats.rx_bytes), 0);
  }

  protected outgoingTrafficBits(stats: AppStats): number {
    return stats.networks.reduce((sum, networkStats) => sum + this.bytesToBits(networkStats.tx_bytes), 0);
  }

  private bytesToBits(bytes: number): number {
    return bytes == null ? 0 : bytes * 8;
  }

  viewDetails(app: App): void {
    // Use location.replaceState to update URL without triggering navigation
    // This prevents router scroll behavior from resetting the scroll position
    this.location.replaceState(`/apps/installed/${app.metadata.train}/${app.id}`);
    this.selectAppForDetails(app.id);
  }

  protected showActionRequired(app: App): void {
    this.viewDetails(app);
    this.navigateAndHighlight.waitForElement(appNotesCardAnchorId, {
      block: 'start',
      inset: true,
    });
  }

  protected onListFiltered(query: string): void {
    this.installedAppsStore.setSearchQuery(query);

    if (!this.filteredApps().length) {
      this.showLoadStatus(EmptyType.NoSearchResults);
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
          this.dataSource.set([]);
          this.showLoadStatus(EmptyType.FirstUse);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!pool;
      }),
      filter(([,dockerStarted]) => {
        if (!dockerStarted) {
          this.dataSource.set([]);
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!dockerStarted;
      }),
      filter(([,, apps]) => {
        if (!apps.length) {
          this.dataSource.set([]);
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!apps.length;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([,, apps]) => {
        this.setDatasourceWithSort(this.sortingInfo(), apps);
        // Preserve the user's current selection across data refreshes (e.g. after
        // start/stop, which re-emits installedApps$). viewDetails() updates the URL
        // via replaceState without touching the route params, so this.appId() only
        // reflects the initial deep-link — falling back to it on every refresh would
        // snap the selection back to the wrong app (or selectFirstApp) and rewrite
        // the URL. Only use it when nothing is selected yet.
        this.selectAppForDetails(this.selectedApp?.id ?? this.appId() ?? null);
        this.cdr.markForCheck();
      },
    });
  }

  start(name: string): void {
    this.dialogService.jobDialog(
      this.appService.startApplication(name),
      { title: this.translate.instant('Starting App'), description: ignoreTranslation(name), canMinimize: true },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<void, AppStartQueryParams> | undefined) => {
        // Job will be undefined if the user minimizes the dialog before completion.
        // When minimized, we intentionally don't track the job here because
        // listenForStatusUpdates() will pick it up via WebSocket events and add it to appJobs.
        // This ensures the UI stays in sync even for minimized jobs.
        if (job) {
          this.appJobs.set(name, job);
          this.setDatasourceWithSort(this.sortingInfo());
          this.cdr.markForCheck();
        }
      });
  }

  stop(name: string): void {
    this.dialogService.jobDialog(
      this.appService.stopApplication(name),
      { title: this.translate.instant('Stopping App'), description: ignoreTranslation(name), canMinimize: true },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<void, AppStartQueryParams> | undefined) => {
        // Job will be undefined if the user minimizes the dialog before completion.
        // When minimized, we intentionally don't track the job here because
        // listenForStatusUpdates() will pick it up via WebSocket events and add it to appJobs.
        // This ensures the UI stays in sync even for minimized jobs.
        if (job) {
          this.appJobs.set(name, job);
          this.setDatasourceWithSort(this.sortingInfo());
          this.cdr.markForCheck();
        }
      });
  }

  restart(name: string): void {
    this.dialogService.jobDialog(
      this.appService.restartApplication(name),
      { title: this.translate.instant('Restarting App'), description: ignoreTranslation(name), canMinimize: true },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<void, AppStartQueryParams> | undefined) => {
        // Job will be undefined if the user minimizes the dialog before completion.
        // When minimized, we intentionally don't track the job here because
        // listenForStatusUpdates() will pick it up via WebSocket events and add it to appJobs.
        // This ensures the UI stays in sync even for minimized jobs.
        if (job) {
          this.appJobs.set(name, job);
          this.setDatasourceWithSort(this.sortingInfo());
          this.cdr.markForCheck();
        }
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
    this.clearSelection();
  }

  onBulkStop(): void {
    this.activeCheckedApps.forEach((app) => this.stop(app.name));
    this.snackbar.success(this.translate.instant(helptextApps.bulkActions.finished));
    this.clearSelection();
  }

  onBulkUpdate(updateAll = false): void {
    const apps = this.dataSource().filter((app) => (
      updateAll ? app.upgrade_available : this.checkedApps.some((checked) => checked.id === app.id)
    ));
    this.tnDialog.open(AppBulkUpdateComponent, { data: apps })
      .closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Clear selection whether the dialog was confirmed or dismissed, to stay
        // consistent with onBulkStart/onBulkStop and the pre-migration behavior.
        this.clearSelection();
      });
  }

  onBulkDelete(): void {
    forkJoin(this.checkedAppsNames.map((appName) => this.appService.checkIfAppIxVolumeExists(appName)))
      .pipe(
        this.loader.withLoader(),
        switchMap((ixVolumesExist) => {
          return this.tnDialog.open<
            AppDeleteDialog,
            AppDeleteDialogInputData,
            AppDeleteDialogOutputData
          >(AppDeleteDialog, {
            data: {
              name: this.checkedAppsNames.join(', '),
              showRemoveVolumes: ixVolumesExist.some(Boolean),
            },
          }).closed;
        }),
        filter(Boolean),
        switchMap((options) => this.executeBulkDeletion(options)),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job: Job<CoreBulkResponse[]>) => this.handleDeletionResult(job));
  }

  setDatasourceWithSort(sort: AppsSort, apps?: App[]): void {
    this.installedAppsStore.setSortingInfo(sort);
    const sourceArray = apps && apps.length > 0 ? apps : this.dataSource();
    this.dataSource.set([...sourceArray].sort((a, b) => {
      const isAsc = sort.direction === 'asc';

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
    }));
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
    if (!this.dataSource().length) {
      this.redirectToInstalledApps();
    }

    this.dialogService.closeAllDialogs();
    const errorMessages = this.getErrorMessages(job.result);

    if (errorMessages) {
      this.dialogService.error({ title: helptextApps.bulkActions.title, message: errorMessages });
    }

    this.clearSelection();
  }

  private getErrorMessages(results: CoreBulkResponse[]): string {
    const errors = results.filter((item) => item.error).map((item) => `<li>${item.error}</li>`);

    return errors.length ? `<ul>${errors.join('')}</ul>` : '';
  }

  private selectAppForDetails(appId: string | null): void {
    if (!this.dataSource().length) {
      return;
    }

    const selectedApp = appId && this.dataSource().find((app) => app.id === appId);
    if (selectedApp) {
      this.selectedApp = selectedApp;
      this.toggleShowMobileDetails.emit(true);
      this.cdr.markForCheck();

      return;
    }

    this.selectFirstApp();
  }

  private selectFirstApp(): void {
    const [firstApp] = this.dataSource();
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
        this.setDatasourceWithSort(this.sortingInfo());
        this.cdr.markForCheck();
      });
  }

  private readonly statsCache = new Map<string, Observable<AppStats>>();

  // De-dupes the per-row stats subscription across the CPU/RAM/I-O/Network cells that
  // each read `getAppStats(row.name) | async`. `refCount: true` tears the shared
  // subscription down once a row leaves the list (search filtering, app removal) and
  // re-attaches cheaply from the backing ComponentStore state on the next render.
  // The Map entry itself is retained (an idle shareReplay factory, not a live
  // subscription); growth is bounded by the number of distinct app names ever rendered.
  getAppStats(name: string): Observable<AppStats> {
    let stats$ = this.statsCache.get(name);
    if (!stats$) {
      stats$ = this.appsStats.getStatsForApp(name).pipe(shareReplay({ bufferSize: 1, refCount: true }));
      this.statsCache.set(name, stats$);
    }
    return stats$;
  }
}
