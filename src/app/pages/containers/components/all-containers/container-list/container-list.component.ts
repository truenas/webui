import {
  Component, ChangeDetectionStrategy,
  computed, effect, inject,
  output,
  signal,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnDialog,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconButtonComponent,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
} from '@truenas/ui-components';
import {
  distinctUntilChanged, filter, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerStats, ContainerStopParams } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerListBulkActionsComponent } from 'app/pages/containers/components/all-containers/container-list/container-list-bulk-actions/container-list-bulk-actions.component';
import { ContainerStatusCellComponent } from 'app/pages/containers/components/all-containers/container-list/container-status-cell/container-status-cell.component';
import {
  StopOptionsDialog, StopOptionsOperation,
} from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ContainerSortField, ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Element-wise reference equality. tn-table clears its selection whenever the
 * `dataSource` reference changes, and the store's `containers` computed re-emits
 * a new array on every state change — including the frequent `container.metrics`
 * patches. Using this as the `filteredContainers` equality keeps the same array
 * reference while the list content is unchanged, so a metrics tick no longer
 * wipes the user's row selection. Metric cells still refresh because they read
 * the `metrics()` signal directly rather than through the row data.
 */
function sameContainers(a: Container[], b: Container[]): boolean {
  return a.length === b.length && a.every((container, index) => container === b[index]);
}

@Component({
  selector: 'ix-container-list',
  templateUrl: './container-list.component.html',
  styleUrls: ['./container-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    BasicSearchComponent,
    FakeProgressBarComponent,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTooltipDirective,
    RequiresRolesDirective,
    ContainerStatusCellComponent,
    ContainerListBulkActionsComponent,
    YesNoPipe,
  ],
})
export class ContainerListComponent {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private containersStore = inject(ContainersStore);
  private searchDirectives = inject(UiSearchDirectivesService);
  private layoutService = inject(LayoutService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private dialog = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);

  readonly containerId = toSignal(this.activatedRoute.params.pipe(map((params) => +params['id'])));
  readonly toggleShowMobileDetails = output<boolean>();

  readonly searchQuery = signal<string>('');

  protected readonly requiredRoles = [Role.ContainerWrite];
  protected readonly containers = this.containersStore.containers;
  protected readonly isLoading = this.containersStore.isLoading;
  protected readonly metrics = this.containersStore.metrics;
  protected readonly selectedContainer = this.containersStore.selectedContainer;
  protected readonly sort = this.containersStore.sort;

  protected readonly table = viewChild(TnTableComponent);

  protected readonly displayedColumns = ['name', 'status', 'autostart', 'cpu', 'ram', 'io', 'controls'];
  protected readonly trackByContainerId = (_: number, container: Container): number => container.id;

  // Track the selection as ids and derive checkedContainers from the live list so
  // the bulk-action getters always read current state for the selected ids rather
  // than a detached snapshot of the row objects tn-table emits.
  private readonly checkedContainerIds = signal<Set<number>>(new Set());
  protected readonly checkedContainers = computed(() => {
    const ids = this.checkedContainerIds();
    return this.containers().filter((container) => ids.has(container.id));
  });

  get hasCheckedContainers(): boolean {
    return this.checkedContainers().length > 0;
  }

  readonly isSelectedContainerVisible = computed(() => {
    return this.filteredContainers()?.some((container) => container.id === this.selectedContainer()?.id);
  });

  protected readonly filteredContainers = computed(() => {
    return (this.containers() || []).filter((container) => {
      return container?.name?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase());
    });
  }, { equal: sameContainers });

  constructor() {
    // tn-table owns its header sort indicator internally (sortColumn/sortDirection are not inputs),
    // so mirror the store's sort state onto the table to reflect the default and any programmatic sort.
    effect(() => {
      const sort = this.sort();
      const table = this.table();
      table?.sortColumn.set(sort.active);
      table?.sortDirection.set(sort.direction);
    });

    toObservable(this.containerId).pipe(
      distinctUntilChanged(),
      tap((containerId) => {
        if (containerId !== null) {
          this.containersStore.selectContainer(containerId);
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    setTimeout(() => {
      this.handlePendingGlobalSearchElement();
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    // tn-table cycles asc → desc → unsorted; the containers list is always sorted, so an
    // empty direction falls back to the default Name-ascending order.
    const active = event.direction && event.column
      ? event.column as ContainerSortField
      : ContainerSortField.Name;
    const direction = event.direction === 'desc' ? SortDirection.Desc : SortDirection.Asc;
    this.containersStore.setSort({ active, direction });
  }

  protected navigateToDetails(container: Container): void {
    this.layoutService.navigatePreservingScroll(this.router, ['/containers', 'view', container.id]);

    this.toggleShowMobileDetails.emit(true);
  }

  protected onSelectionChange(containers: Container[]): void {
    this.checkedContainerIds.set(new Set(containers.map((container) => container.id)));
  }

  protected resetSelection(): void {
    this.table()?.selection.clear();
    this.checkedContainerIds.set(new Set());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
  }

  protected isStopped(container: Container): boolean {
    return container?.status?.state === ContainerStatus.Stopped;
  }

  protected getMetrics(container: Container): ContainerStats | undefined {
    return this.metrics()?.[container.id];
  }

  protected hasMetrics(container: Container): boolean {
    const metrics = this.getMetrics(container);

    return container?.status?.state === ContainerStatus.Running
      && !!metrics
      && Object.keys(metrics).length > 0;
  }

  protected start(container: Container): void {
    this.api.call('container.start', [container.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container started'));
        this.containersStore.reload();
      });
  }

  protected stop(container: Container): void {
    this.tnDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Stop })
      .closed
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          return this.dialog.jobDialog(
            this.api.job('container.stop', [container.id, options]),
            { title: this.translate.instant('Stopping Container') },
          ).afterClosed();
        }),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container stopped'));
        this.containersStore.reload();
      });
  }

  protected restart(container: Container): void {
    this.tnDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Restart })
      .closed
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          return this.dialog.jobDialog(
            this.api.job('container.stop', [container.id, options]),
            { title: this.translate.instant('Stopping Container') },
          ).afterClosed();
        }),
        switchMap(() => this.api.call('container.start', [container.id]).pipe(
          this.loader.withLoader(),
        )),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container restarted'));
        this.containersStore.reload();
      });
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
