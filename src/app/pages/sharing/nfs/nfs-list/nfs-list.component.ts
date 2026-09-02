import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { shared } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { actionsColumn, column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { nfsListElements } from 'app/pages/sharing/nfs/nfs-list/nfs-list.elements';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { EntitlementsService } from 'app/services/entitlements.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-nfs-list',
  templateUrl: './nfs-list.component.html',
  styleUrls: ['./nfs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    RouterLink,
    UiSearchDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TierStatusComponent,
    TnTablePagerComponent,
    TnTooltipDirective,
    TranslateModule,
    YesNoPipe,
  ],
})
export class NfsListComponent implements OnInit {
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private store$ = inject<Store<AppState>>(Store);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);
  private tierService = inject(SharingTierService);

  protected readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  protected readonly searchableElements = nfsListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly searchQuery = signal('');

  private readonly shares$ = this.api.call('sharing.nfs.query').pipe(
    tap((shares) => this.nfsShares = shares),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly dataProvider = new AsyncDataProvider<NfsShare>(this.shares$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$);
  protected readonly hasNfsSnapshots = this.entitlements.entitled(EntitlementFeature.NfsSnapshot);

  private nfsShares: NfsShare[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  private tierAction: IconActionConfig<NfsShare> = this.tierService.createChangeTierAction<NfsShare>({
    destroyRef: this.destroyRef,
    reload: () => this.refresh(),
    requiredRoles: this.requiredRoles,
  });

  protected readonly actions: IconActionConfig<NfsShare>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    this.tierAction,
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => {
        this.dialog.confirmDelete({
          title: this.translate.instant('Delete {name}', { name: row.path }),
          message: this.translate.instant(shared.deleteShareMessage),
          call: () => this.api.call('sharing.nfs.delete', [row.id]),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
      },
      requiredRoles: this.requiredRoles,
    },
  ];

  // Column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`. The
  // `tier` column is reactive (see `displayedColumns`), not picker-managed.
  protected readonly columns = signal(createTable<NfsShare>([
    column({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    column({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    column({
      title: this.translate.instant('Networks'),
      propertyName: 'networks',
    }),
    column({
      title: this.translate.instant('Hosts'),
      propertyName: 'hosts',
    }),
    column({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    column({
      title: this.translate.instant('Expose Snapshots'),
      propertyName: 'expose_snapshots',
      hidden: !this.hasNfsSnapshots(),
    }),
    actionsColumn(),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => {
    const columns = toDisplayedColumns(this.columns());
    if (this.tierService.tierEnabled()) {
      const actionsIndex = columns.indexOf('actions');
      const insertAt = actionsIndex >= 0 ? actionsIndex : columns.length;
      columns.splice(insertAt, 0, 'tier');
    }
    return columns;
  });

  protected readonly trackByNfsId = (_index: number, row: NfsShare): number => row.id;

  protected uniqueRowTag(row: NfsShare): string {
    return toUniqueRowTag('nfs-share-' + row.path + '-' + row.comment);
  }

  protected ariaLabel(row: NfsShare): string {
    return [row.path, this.translate.instant('NFS Share')].join(' ');
  }

  protected formatList(values: string[]): string {
    return (values ?? []).join(', ');
  }

  protected isToggleDisabled(row: NfsShare): boolean {
    return isShareUnavailable(row, this.activePoolPaths());
  }

  protected getEnabledTooltip(row: NfsShare): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(row, this.activePoolPaths()))
      : '';
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.refresh();
      },
      error: () => {
        this.refresh();
      },
    });

    // Prime the tier config so `displayedColumns` reactively reveals the tier
    // column when tiering is enabled, and reload the list on tier-job ticks.
    this.tierService.getTierConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tierService.wireTierJobRefresh({
      destroyRef: this.destroyRef,
      reload: () => this.refresh(),
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'path',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(NfsFormComponent, {
      title: this.translate.instant('Add NFS Share'),
      inputs: { nfsShareData: { existingNfsShare: undefined } },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected doEdit(row: NfsShare): void {
    this.formPanel.open(NfsFormComponent, {
      title: this.translate.instant('Edit NFS Share'),
      inputs: { nfsShareData: { existingNfsShare: row } },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<NfsShare>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.nfsShares.length ? [] : Object.keys(this.nfsShares[0]) as (keyof NfsShare)[],
    });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  protected onChangeEnabledState(row: NfsShare): void {
    this.api.call('sharing.nfs.update', [row.id, { enabled: !row.enabled }]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
