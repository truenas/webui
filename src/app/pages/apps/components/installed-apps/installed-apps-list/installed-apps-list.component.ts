import { SelectionModel } from '@angular/cdk/collections';
import { AsyncPipe, Location } from '@angular/common';
import { Component, ChangeDetectionStrategy, output, input, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
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
  combineLatest, filter, forkJoin, map, Observable, switchMap,
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

@UntilDestroy()
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

  readonly appId = toSignal(this.activatedRoute.params.pipe(map((params) => params['appId'])));
  readonly isMobileView = input<boolean>();
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
    return this.checkedAppsNames
      .map((id) => this.dataSource.find((app) => app.id === id))
      .filter((app): app is App => !!app);
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

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd),
        untilDestroyed(this),
      )
      .subscribe(() => {
        if (this.router.currentNavigation()?.extras?.state?.hideMobileDetails) {
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
    this.layoutService.navigatePreservingScroll(this.router, ['/apps/installed', app.metadata.train, app.id]);

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);

    if (!this.filteredApps.length) {
      this.showLoadStatus(EmptyType.NoSearchResults);
    }
  }

  toggleAppsChecked(checked: boolean): void {
    if (checked) {
      this.filteredApps.forEach((app) => this.selection.select(app.id));
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
        this.selectAppForDetails(this.appId() as string);
        this.cdr.markForCheck();
      },
    });
  }

  start(name: string): void {
    this.appService.startApplication(name)
      .pipe(
        this.errorHandler.withErrorHandler(),
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
        this.errorHandler.withErrorHandler(),
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
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((job: Job<void, AppStartQueryParams>) => {
        this.appJobs.set(name, job);
        this.sortChanged(this.sortingInfo);
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
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
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
        untilDestroyed(this),
      )
      .subscribe((job: Job<CoreBulkResponse[]>) => this.handleDeletionResult(job));
  }

  sortChanged(sort: Sort, apps?: App[]): void {
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

  private selectAppForDetails(appId: string | null): void {
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
    this.onListFiltered('');
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
