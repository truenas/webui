import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { of, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared } from 'app/helptext/sharing';
import { SmbSharePurpose, SmbShare, ExternalSmbShareOptions } from 'app/interfaces/smb-share.interface';
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
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { smbListElements } from 'app/pages/sharing/smb/smb-list/smb-list.elements';
import { getFilesystemAclUnavailableReason, getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-smb-list',
  templateUrl: './smb-list.component.html',
  styleUrls: ['./smb-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    ServiceStateButtonComponent,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    RouterLink,
    TestDirective,
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
    AsyncPipe,
    YesNoPipe,
  ],
})
export class SmbListComponent implements OnInit {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<ServicesState>>(Store);
  private poolStoreService = inject(poolStore);
  private tierService = inject(SharingTierService);

  protected readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  protected readonly searchableElements = smbListElements;
  protected readonly EmptyType = EmptyType;

  service$ = this.store$.select(selectService(ServiceName.Cifs));

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<SmbShare>;

  smbShares: SmbShare[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  private tierAction: IconActionConfig<SmbShare> = this.tierService.createChangeTierAction<SmbShare>({
    destroyRef: this.destroyRef,
    reload: () => this.dataProvider.load(),
    requiredRoles: this.requiredRoles,
  });

  protected readonly actions: IconActionConfig<SmbShare>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('share-variant', 'mdi'),
      tooltip: this.translate.instant('Edit Share ACL'),
      disabled: (row) => of(isShareUnavailable(row, this.activePoolPaths())),
      disabledTooltip: (row: SmbShare) => this.translate.instant(getUnavailableReason(row, this.activePoolPaths())),
      onClick: (row) => this.doEditShareAcl(row),
    },
    {
      iconName: tnIconMarker('security', 'mdi'),
      tooltip: this.translate.instant('Edit Filesystem ACL'),
      disabled: (row) => of(isRootShare(row.path) || isShareUnavailable(row, this.activePoolPaths())),
      disabledTooltip: (row: SmbShare) => this.translate.instant(
        getFilesystemAclUnavailableReason(row, this.activePoolPaths()),
      ),
      onClick: (row) => {
        this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
          queryParams: {
            path: row.path,
            returnUrl: this.router.url,
          },
        });
      },
    },
    this.tierAction,
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => {
        this.dialog.confirmDelete({
          title: this.translate.instant('Unshare {name}', { name: row.name }),
          message: this.translate.instant(shared.deleteShareMessage),
          buttonText: this.translate.instant('Unshare'),
          call: () => this.api.call('sharing.smb.delete', [row.id]),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dataProvider.load());
      },
    },
  ];

  // ix-table column model retained purely to drive <ix-table-column-picker>;
  // tn-table renders cells from the template and derives `displayedColumns` via
  // `toDisplayedColumns`. The `tier` column is reactive, not picker-managed.
  protected readonly columns = signal(createTable<SmbShare>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    yesNoColumn({
      title: this.translate.instant('Audit Logging'),
      propertyName: 'audit',
    }),
    actionsColumn({}),
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

  protected readonly trackBySmbId = (_index: number, row: SmbShare): number => row.id;

  protected uniqueRowTag(row: SmbShare): string {
    // Pre-split with lodash kebabCase: it breaks letter–digit boundaries ('share1' → 'share-1')
    // while the library's kebab does not, so the tag resolves identically through the legacy
    // [ixTest] directive and the tn cell components — byte-matching pre-migration data-test values.
    return kebabCase(convertStringToId('smb-' + row.name));
  }

  protected ariaLabel(row: SmbShare): string {
    return [row.name, this.translate.instant('SMB Share')].join(' ');
  }

  protected getPathValue(row: SmbShare): string {
    return (row.options as ExternalSmbShareOptions)?.remote_path?.join(', ') || row.path;
  }

  protected isToggleDisabled(row: SmbShare): boolean {
    return isShareUnavailable(row, this.activePoolPaths());
  }

  protected getEnabledTooltip(row: SmbShare): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(row, this.activePoolPaths()))
      : '';
  }

  ngOnInit(): void {
    const shares$ = this.api.call('sharing.smb.query').pipe(
      tap((shares) => this.smbShares = shares),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<SmbShare>(shares$);
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.dataProvider.load();
      },
      error: () => {
        this.dataProvider.load();
      },
    });

    // Prime the tier config so `displayedColumns` reactively reveals the tier
    // column when tiering is enabled, and reload the list on tier-job ticks.
    this.tierService.getTierConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tierService.wireTierJobRefresh({
      destroyRef: this.destroyRef,
      reload: () => this.dataProvider.load(),
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(SmbFormComponent, {
      title: this.translate.instant('Add SMB Share'),
      inputs: { smbShareData: { existingSmbShare: undefined } },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected doEdit(row: SmbShare): void {
    this.formPanel.open(SmbFormComponent, {
      title: this.translate.instant('Edit SMB Share'),
      inputs: { smbShareData: { existingSmbShare: row } },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  private doEditShareAcl(row: SmbShare): void {
    // A home share has a name (homes) set; row.name works for other shares.
    const searchName = (row.purpose === SmbSharePurpose.LegacyShare && row.options?.home)
      ? 'homes'
      : row.name;
    this.loader.open();
    this.api.call('sharing.smb.getacl', [{ share_name: searchName }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shareAcl) => {
        this.loader.close();
        this.formPanel.open(SmbAclComponent, {
          title: this.translate.instant('Share ACL for {share}', { share: shareAcl.share_name }),
          inputs: { shareName: shareAcl.share_name },
        }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
      });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<SmbShare>(event, this.displayedColumns()));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.smbShares.length ? [] : Object.keys(this.smbShares[0]) as (keyof SmbShare)[],
    });
    this.cdr.markForCheck();
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private onChangeEnabledState(row: SmbShare): void {
    this.api.call('sharing.smb.update', [row.id, { enabled: !row.enabled }]).pipe(
      this.loader.withLoader(),
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

  protected onToggle(row: SmbShare): void {
    this.onChangeEnabledState(row);
  }
}
