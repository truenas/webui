import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe, Location } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, output, OnInit, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
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
  catchError, combineLatest, debounceTime, filter, forkJoin, map, Observable, of, shareReplay, switchMap,
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
import { safeAdd, sumNetworkFieldAsBits } from 'app/pages/apps/utils/network-stats.utils';
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

  // Modern signal-based architecture - installedApps from store
  protected readonly installedApps = toSignal(this.installedAppsStore.installedApps$, { initialValue: [] });

  readonly selectedApp = signal<App | undefined>(undefined);
  searchQuery = signal('');
  appJobs = new Map<string, Job<void, AppStartQueryParams>>();
  selection = new SelectionModel<string>(true, []);

  // Signal to track selection changes for reactive computed properties
  private selectionChanged = signal(0);

  // Sorting state as signals for reactivity
  private sortField = signal<SortableField>(SortableField.Application);
  private sortDirection = signal<'asc' | 'desc'>('asc');

  sortingInfo: Sort = {
    active: SortableField.Application,
    direction: 'asc',
  };

  truenasAppsExpanded = signal(true);
  externalAppsExpanded = signal(true);

  readonly sortableField = SortableField;

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant(helptextApps.message.loading),
  };

  // Computed signal for sorted apps (reactive to store changes and sorting)
  protected readonly sortedApps = computed(() => {
    const apps = [...this.installedApps()];
    const field = this.sortField();
    const isAsc = this.sortDirection() === 'asc';

    return apps.sort((a, b) => {
      switch (field) {
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
  });

  readonly isSelectedAppVisible = computed(() => {
    const selected = this.selectedApp();
    if (!selected) return false;
    return this.filteredApps().some((app: App) => app.id === selected.id);
  });

  readonly filteredApps = computed(() => {
    return this.sortedApps()
      .filter((app) => app?.name?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase()));
  });

  readonly filteredTruenasApps = computed(() => {
    return this.filteredApps().filter((app: App) => isTruenasApp(app));
  });

  readonly filteredExternalApps = computed(() => {
    return this.filteredApps().filter((app: App) => isExternalApp(app));
  });

  // Map for O(1) app lookups
  private readonly appsById = computed(() => {
    return new Map(this.sortedApps().map((app) => [app.id, app]));
  });

  readonly allAppsChecked = computed(() => {
    this.selectionChanged(); // Track selection changes
    return this.selection.selected.length === this.filteredTruenasApps().length
      && this.filteredTruenasApps().length > 0;
  });

  readonly hasCheckedApps = computed(() => {
    this.selectionChanged(); // Track selection changes
    return this.selection.selected.length > 0;
  });

  readonly appsUpdateAvailable = computed(() => {
    return this.sortedApps().filter((app) => app.upgrade_available).length;
  });

  readonly hasUpdates = computed(() => {
    return this.sortedApps().some((app) => app.upgrade_available);
  });

  readonly checkedAppsNames = computed(() => {
    this.selectionChanged(); // Track selection changes
    return this.selection.selected;
  });

  readonly checkedApps = computed(() => {
    this.selectionChanged(); // Track selection changes
    const appsMap = this.appsById();
    return this.selection.selected
      .map((id) => appsMap.get(id))
      .filter((app): app is App => !!app && isTruenasApp(app));
  });

  readonly activeCheckedApps = computed(() => {
    this.selectionChanged(); // Track selection changes
    return this.sortedApps().filter(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state)
        && this.selection.isSelected(app.id)
        && isTruenasApp(app),
    );
  });

  readonly stoppedCheckedApps = computed(() => {
    this.selectionChanged(); // Track selection changes
    return this.sortedApps().filter(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state)
        && this.selection.isSelected(app.id)
        && isTruenasApp(app),
    );
  });

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

    if (!this.filteredApps().length) {
      this.showLoadStatus(EmptyType.NoSearchResults);
    }
  }

  toggleAppsChecked(checked: boolean): void {
    if (checked) {
      this.filteredTruenasApps().forEach((app: App) => this.selection.select(app.id));
    } else {
      this.selection.clear();
    }
    this.selectionChanged.update((count) => count + 1); // Trigger reactivity
  }

  toggleAppSelection(appId: string): void {
    this.selection.toggle(appId);
    this.selectionChanged.update((count) => count + 1); // Trigger reactivity
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
          this.showLoadStatus(EmptyType.FirstUse);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!pool;
      }),
      filter(([,dockerStarted]) => {
        if (!dockerStarted) {
          this.showLoadStatus(EmptyType.Errors);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!dockerStarted;
      }),
      filter(([,, apps]) => {
        if (!apps.length) {
          this.showLoadStatus(EmptyType.NoPageData);
          this.cdr.markForCheck();
          this.redirectToInstalledApps();
        }
        return !!apps.length;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
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
    this.stoppedCheckedApps().forEach((app) => this.start(app.name));
    this.snackbar.success(this.translate.instant(helptextApps.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkStop(): void {
    this.activeCheckedApps().forEach((app) => this.stop(app.name));
    this.snackbar.success(this.translate.instant(helptextApps.bulkActions.finished));
    this.toggleAppsChecked(false);
  }

  onBulkUpdate(updateAll = false): void {
    const apps = this.sortedApps().filter((app) => (
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
    forkJoin(this.checkedAppsNames().map((appName) => this.appService.checkIfAppIxVolumeExists(appName)))
      .pipe(
        this.loader.withLoader(),
        switchMap((ixVolumesExist) => {
          return this.matDialog.open<
            AppDeleteDialog,
            AppDeleteDialogInputData,
            AppDeleteDialogOutputData
          >(AppDeleteDialog, {
            data: {
              name: this.checkedAppsNames().join(', '),
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
   * Updates sorting configuration using signals for reactive updates.
   *
   * Sorting Strategy:
   * - Sorts by Application name, State, or Updates availability
   * - Both TrueNAS and External apps are sorted together via sortedApps computed signal
   * - This ensures consistent alphabetical/state ordering across all apps
   *
   * Template Rendering:
   * - The template splits the sorted array into separate sections via
   *   filteredTruenasApps and filteredExternalApps computed signals
   * - Each section preserves the sort order from sortedApps
   * - Example: If sorted A-Z, both sections will be alphabetically ordered
   */
  setDatasourceWithSort(sort: Sort): void {
    this.sortingInfo = sort;
    this.sortField.set(sort.active as SortableField);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
  }

  private executeBulkDeletion(options: AppDeleteDialogOutputData): Observable<Job<CoreBulkResponse[]>> {
    const bulkDeletePayload = this.checkedAppsNames().map((name) => [
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
    if (!this.sortedApps().length) {
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
    if (!this.sortedApps().length) {
      return;
    }

    const selectedApp = appId && this.sortedApps().find((app) => app.id === appId);
    if (selectedApp) {
      this.selectedApp.set(selectedApp);
      this.toggleShowMobileDetails.emit(true);
      this.cdr.markForCheck();

      return;
    }

    this.selectFirstApp();
  }

  private selectFirstApp(): void {
    const [firstApp] = this.sortedApps();
    if (firstApp.metadata.train && firstApp.id) {
      this.location.replaceState(['/apps', 'installed', firstApp.metadata.train, firstApp.id].join('/'));
    } else {
      this.location.replaceState(['/apps', 'installed'].join('/'));
    }

    this.selectedApp.set(firstApp);
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
        this.cdr.markForCheck();
      });
  }

  getAppStats(name: string): Observable<AppStats> {
    return this.appsStats.getStatsForApp(name);
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
          networkRxBits: 0,
          networkTxBits: 0,
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
              cpu: safeAdd(totals.cpu, stats.cpu_usage),
              memory: safeAdd(totals.memory, stats.memory),
              blkioRead: safeAdd(totals.blkioRead, stats.blkio?.read),
              blkioWrite: safeAdd(totals.blkioWrite, stats.blkio?.write),
              networkRxBits: safeAdd(totals.networkRxBits, sumNetworkFieldAsBits(stats.networks, 'rx_bytes')),
              networkTxBits: safeAdd(totals.networkTxBits, sumNetworkFieldAsBits(stats.networks, 'tx_bytes')),
            };
          }, {
            cpu: 0,
            memory: 0,
            blkioRead: 0,
            blkioWrite: 0,
            networkRxBits: 0,
            networkTxBits: 0,
          });
        }),
        catchError((error: unknown) => {
          console.error('Error fetching app stats:', error);
          // Return zero utilization on error (e.g., app deleted mid-fetch)
          return of({
            cpu: 0,
            memory: 0,
            blkioRead: 0,
            blkioWrite: 0,
            networkRxBits: 0,
            networkTxBits: 0,
          });
        }),
      );
    }),
    takeUntilDestroyed(this.destroyRef),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
