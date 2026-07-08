import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective, TnSidePanelActionDirective, TnSidePanelComponent,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { shared } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { NfsFormComponent, NfsFormData } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { nfsListElements } from 'app/pages/sharing/nfs/nfs-list/nfs-list.elements';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

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
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    NfsFormComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class NfsListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);
  private tierService = inject(SharingTierService);
  private unsavedChanges = inject(UnsavedChangesService);

  protected readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  protected readonly searchableElements = nfsListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly searchQuery = signal('');
  protected dataProvider: AsyncDataProvider<NfsShare>;
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  private nfsShares: NfsShare[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  // Side-panel host for the add/edit form (the form is dual-host: it also opens
  // via legacy SlideIn from the shares-dashboard card).
  protected readonly configOpen = signal(false);
  protected readonly formData = signal<NfsFormData | undefined>(undefined);
  protected readonly configForm = viewChild(NfsFormComponent);
  protected readonly sidePanelTitle = computed(() => (this.formData()?.existingNfsShare
    ? this.translate.instant('Edit NFS Share')
    : this.translate.instant('Add NFS Share')));

  protected readonly closeFormGuard = sidePanelFormCloseGuard(this.unsavedChanges, this.configForm);

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

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`. The
  // `tier` column is reactive (see `displayedColumns`), not picker-managed.
  protected readonly columns = signal(createTable<NfsShare>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('Networks'),
      propertyName: 'networks',
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      propertyName: 'hosts',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    yesNoColumn({
      title: this.translate.instant('Expose Snapshots'),
      propertyName: 'expose_snapshots',
      hidden: !this.isEnterprise(),
    }),
    actionsColumn({}),
  ], {
    uniqueRowTag: (row) => 'nfs-share-' + row.path + '-' + row.comment,
    ariaLabels: (row) => [row.path, this.translate.instant('NFS Share')],
  }));

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
    // Pre-split with lodash kebabCase: it breaks letter–digit boundaries ('pool1' → 'pool-1')
    // while the library's kebab does not, so the pre-split tag resolves identically through
    // the legacy [ixTest] directive, the library [tnTestId] directive, and the tn cell
    // components — byte-matching the pre-migration data-test values.
    return kebabCase(convertStringToId('nfs-share-' + row.path + '-' + row.comment));
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
    const shares$ = this.api.call('sharing.nfs.query').pipe(
      tap((shares) => this.nfsShares = shares),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<NfsShare>(shares$);
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
    this.formData.set(undefined);
    this.configOpen.set(true);
  }

  protected doEdit(row: NfsShare): void {
    this.formData.set({ existingNfsShare: row });
    this.configOpen.set(true);
  }

  protected onFormClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.refresh();
    }
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<NfsShare>(event, this.displayedColumns()));
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
