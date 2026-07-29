import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnDetailRowDefDirective, TnDialog, TnEmptyComponent,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import {
  defer, filter, forkJoin, map, Subject,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Disk, DetailsDisk, ExtraDiskQueryOptions } from 'app/interfaces/disk.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, restrictToSingleExpandedRow,
  toDisplayedColumns,
} from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskBulkEditComponent } from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent, DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { diskListElements } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.elements';
import { ResetSedDialog } from 'app/pages/storage/modules/disks/components/disk-list/reset-sed-dialog/reset-sed-dialog.component';
import {
  sedStatusColumn, sedStatusLabel,
} from 'app/pages/storage/modules/disks/components/disk-list/sed-status-cell/sed-status-cell.component';
import { UnlockSedDialog } from 'app/pages/storage/modules/disks/components/disk-list/unlock-sed-dialog/unlock-sed-dialog.component';
import { DiskWipeDialog } from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { LicenseService } from 'app/services/license.service';

/**
 * A disk row with every display-only value resolved once, when the rows are built. The
 * templates bind these fields instead of calling methods, so translation and size formatting
 * don't re-run for every visible row on every change detection.
 *
 * The translated fields are resolved once, so a runtime language switch only reaches them on
 * the next reload — the same as the column titles above, which every list in the app builds
 * with `translate.instant` at construction.
 */
interface DiskRow extends Disk {
  sizeText: string;
  sedStatusText: string;
  hddStandbyText: string;
  advPowerManagementText: string;
}

/**
 * Drops the display-only fields again at the boundary with the edit forms, which type
 * their input as `Disk` — the pre-migration screen stripped its own UI-only row state
 * (`selected`) here for the same reason. `pool` stays as the display text the row was
 * built with, as it was before the migration.
 */
function toDisk(row: DiskRow): Disk {
  const {
    sizeText, sedStatusText, hddStandbyText, advPowerManagementText, ...disk
  } = row;
  return disk;
}

@Component({
  selector: 'ix-disk-list',
  templateUrl: './disk-list.component.html',
  styleUrls: ['./disk-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    TableColumnPickerComponent,
    UiSearchDirective,
    TnButtonComponent,
    RequiresRolesDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    IxTableDetailsRowComponent,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class DiskListComponent {
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private licenseService = inject(LicenseService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DiskWrite];
  protected readonly searchableElements = diskListElements;

  private readonly diskUpdates$ = new Subject<DiskFormResponse[number]>();

  protected readonly searchQuery = signal('');

  // `hasSed$` is a store selector, so this resolves synchronously at field init — both the
  // SED column's default visibility and the disk.query `extra` args read it. `requireSync`
  // makes that a hard error rather than two silent omissions if it ever becomes async.
  private readonly hasSed = toSignal(this.licenseService.hasSed$, { requireSync: true });

  private disks: DiskRow[] = [];
  private unusedDisks: DetailsDisk[] = [];

  private readonly disks$ = defer(() => {
    const extraOptions: ExtraDiskQueryOptions = {
      extra: {
        pools: true,
        passwords: true,
        ...(this.hasSed() && { sed_status: true }),
      },
    };

    return forkJoin([
      this.api.call('disk.details').pipe(
        map((diskDetails) => [
          ...diskDetails.unused,
          ...diskDetails.used.filter((disk) => disk.exported_zpool),
        ]),
      ),
      this.api.call('disk.query', [[], extraOptions]),
    ]).pipe(
      map(([unusedDisks, disks]) => {
        this.unusedDisks = unusedDisks;
        this.disks = disks.map((disk) => this.toRow(disk));
        return this.disks;
      }),
    );
  });

  protected readonly dataProvider = new AsyncDataProvider<DiskRow>(this.disks$);

  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$, { initialValue: 0 });
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$, { initialValue: EmptyType.Loading });

  protected readonly emptyConfig = computed(() => this.emptyService.defaultEmptyConfig(this.emptyType()));
  protected readonly emptyIcon = computed(() => this.emptyService.iconForType(this.emptyType()));

  // `tn-empty` renders its action whenever `actionText` is set, so keep the previous behavior of
  // only offering one for the no-results and error states — the other states had no button.
  protected readonly emptyActionText = computed<string | undefined>(() => {
    switch (this.emptyType()) {
      case EmptyType.NoSearchResults:
        return this.translate.instant('Reset');
      case EmptyType.Errors:
        return this.translate.instant('Retry');
      default:
        return undefined;
    }
  });

  private readonly table = viewChild(TnTableComponent<DiskRow>);

  // The data provider keeps its sorting, but tn-table tracks its own sort-arrow state — and the
  // table is destroyed whenever the list empties out, since the empty state replaces it in the
  // template. Searching down to zero results and clearing the search again therefore builds a
  // fresh table whose header shows no arrow over rows that are still sorted. Remember the last
  // sort and reflect it into whichever table instance is currently mounted.
  private readonly activeSort = signal<TnSortEvent | null>(null);

  // Held by identifier rather than by row reference: a save rebuilds every row object, and
  // selection derived from the current rows can't hand a batch action pre-edit data.
  //
  // Deliberate behavior change from the pre-migration screen, which tracked a `selected` flag on
  // its full internal list and so kept a page-1 selection alive while you paged or searched.
  // tn-table clears its own selection whenever `[dataSource]` changes, so a selection now covers
  // only the rows currently on screen — batch-editing rows you can no longer see was confusing,
  // and the checkboxes and the batch bar now always agree on what is selected.
  private readonly selectedIdentifiers = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedDisks = computed(
    () => this.rows().filter((disk) => this.selectedIdentifiers().has(disk.identifier)),
  );

  // The ix-table column model is retained purely as picker metadata (visibility + saved
  // preferences) and to drive the hidden-column readout inside the expanded detail row;
  // tn-table renders its own cells from the templates below.
  protected readonly columns = signal(createTable<DiskRow>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Serial'),
      propertyName: 'serial',
    }),
    textColumn({
      title: this.translate.instant('Disk Size'),
      propertyName: 'size',
      getValue: (disk) => disk.sizeText,
      // Sort by the raw byte count, not by the formatted "5 GiB" text.
      sortBy: (disk) => disk.size,
    }),
    textColumn({
      title: this.translate.instant('Pool'),
      propertyName: 'pool',
    }),
    textColumn({
      title: this.translate.instant('Disk Type'),
      propertyName: 'type',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Model'),
      propertyName: 'model',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Transfer Mode'),
      propertyName: 'transfermode',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Rotation Rate (RPM)'),
      propertyName: 'rotationrate',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('HDD Standby'),
      propertyName: 'hddstandby',
      getValue: (row) => row.hddStandbyText,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (row) => row.advPowerManagementText,
      hidden: true,
    }),
    sedStatusColumn({
      title: this.translate.instant('Self-Encrypting Drive (SED)'),
      propertyName: 'sed_status',
      // Sort by the translated status the cell renders, not by the raw SedStatus enum.
      sortBy: (row) => row.sedStatusText,
      hidden: !this.hasSed(),
    }),
  ], {
    // Still needed by the ix-table cell components the details row renders for the
    // hidden columns — they resolve their own data-test ids and aria labels from these.
    uniqueRowTag: (row) => `disk-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Disk')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<Column<DiskRow, ColumnComponent<DiskRow>>[]>(
    () => this.columns().filter((column) => column?.hidden),
  );

  protected readonly trackByIdentifier = (_: number, row: DiskRow): string => row.identifier;

  constructor() {
    restrictToSingleExpandedRow(this.table);

    effect(() => {
      const table = this.table();
      const sort = this.activeSort();
      if (!table || !sort) {
        return;
      }
      table.sortColumn.set(sort.column);
      table.sortDirection.set(sort.direction);
    });

    this.dataProvider.load();

    this.diskUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((diskUpdate) => {
      // find the edited disk inside our internal representation of the disks
      // and update it to match the new params.
      this.disks = this.disks.map((disk) => {
        if (disk.identifier === diskUpdate.identifier) {
          // Rebuild the row so its display-only fields reflect the edited values too.
          return this.toRow({ ...disk, ...diskUpdate });
        }

        return disk;
      });

      // trigger a UI update by manually setting the rows in the data provider.
      // ultimately, if this is being called, we've already called the data provider's
      // `load` method and are just waiting for it to come back. this takes some time though (5-10s), so
      // we reconcile the local UI immediately so there is zero inconsistency.
      this.dataProvider.setRows(this.disks);
    });
  }

  protected onSelectionChange(disks: DiskRow[]): void {
    this.selectedIdentifiers.set(new Set(disks.map((disk) => disk.identifier)));
  }

  /**
   * Test-id fragment for a row's action buttons. Split with lodash `kebabCase` rather than
   * handed to the library's test-id kebab, which doesn't break letter–digit boundaries
   * (`nvme0n1` → `nvme-0-n-1` vs `nvme0n1`) — passing the raw name would silently rename every
   * NVMe row's ids out from under the e2e locators.
   *
   * A method rather than a field on {@link DiskRow}: it is a test-id concern, not row data, and
   * keeping it out of the row keeps `toDisk` from having to strip it again. Only the expanded
   * detail row renders these buttons (and only one row expands at a time), so re-running
   * `kebabCase` per change detection costs nothing.
   */
  protected testIdTag(row: DiskRow): string {
    return kebabCase(row.name);
  }

  protected onRowClick(row: DiskRow): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.activeSort.set(event);
    // Pass the column model so the derived columns keep sorting by their displayed
    // text (and Disk Size by its raw byte count), the way ix-table's head did.
    this.dataProvider.setSorting(mapTnSortToTableSort(event, {
      displayedColumns: this.displayedColumns(),
      columns: this.columns(),
    }));
  }

  protected onColumnsChange(columns: Column<DiskRow, ColumnComponent<DiskRow>>[]): void {
    this.columns.set([...columns]);
  }

  protected onEmptyAction(): void {
    if (this.emptyType() === EmptyType.NoSearchResults) {
      this.onListFiltered('');
      return;
    }

    this.dataProvider.load();
  }

  protected edit(rows: DiskRow[]): void {
    const disks = rows.map((row) => toDisk(row));
    const result$ = disks.length > 1
      ? this.formPanel.open<DiskFormResponse | null>(DiskBulkEditComponent, {
          title: this.translate.instant('Bulk Edit Disks'),
          inputs: { disksToEdit: disks },
        })
      : this.formPanel.open<DiskFormResponse | null>(DiskFormComponent, {
          title: this.translate.instant('Edit Disk'),
          inputs: { diskToEdit: disks[0] },
        });

    result$.onSuccess((response) => {
      // this gets the updated disk data from the disk edit form (both single and bulk)
      // and emits it over `diskUpdates$`.
      response?.forEach((upd) => this.diskUpdates$.next(upd));
      // A save invalidates the selection it was made from: the rows are rebuilt, so the
      // pre-edit data behind it is gone. tn-table also clears its own checkboxes when the
      // data source is replaced, but don't depend on it emitting `(selectionChange)` for
      // that — clear here so the batch bar and the checkboxes can't disagree.
      this.selectedIdentifiers.set(new Set());
      this.dataProvider.load();
    }, this.destroyRef);
  }

  protected wipe(disk: Disk): void {
    const exportedPool = this.unusedDisks.find((dev) => dev.devname === disk.devname)?.exported_zpool;
    const dialog = this.tnDialog.open(DiskWipeDialog, {
      data: {
        diskName: disk.name,
        exportedPool,
      },
    });
    dialog.closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected unlock(disk: Disk): void {
    this.tnDialog.open(UnlockSedDialog, {
      data: { diskName: disk.name },
    }).closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected resetSed(disk: Disk): void {
    this.tnDialog.open(ResetSedDialog, {
      data: { diskName: disk.name },
    }).closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected isSedLocked(disk: Disk): boolean {
    return disk.sed && disk.sed_status === SedStatus.Locked;
  }

  protected isUnusedDisk(disk: Disk): boolean {
    return !!this.unusedDisks.find((unusedDisk) => unusedDisk.name === disk.name);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ list: this.disks, query, columnKeys: ['name', 'pool', 'serial', 'size'] });
  }

  private toRow(disk: Disk): DiskRow {
    return {
      ...disk,
      pool: this.getPoolColumn(disk),
      sizeText: buildNormalizedFileSize(disk.size),
      sedStatusText: this.translate.instant(sedStatusLabel(disk)),
      hddStandbyText: disk.hddstandby === DiskStandby.AlwaysOn
        ? this.translate.instant('Always On')
        : disk.hddstandby,
      advPowerManagementText: disk.advpowermgmt === DiskPowerLevel.Disabled
        ? this.translate.instant('Disabled')
        : disk.advpowermgmt,
    };
  }

  private getPoolColumn(diskToCheck: Disk): string {
    const unusedDisk = this.unusedDisks.find((disk) => disk.devname === diskToCheck.devname);
    if (unusedDisk?.exported_zpool) {
      return `${unusedDisk.exported_zpool} (${this.translate.instant('Exported')})`;
    }
    return diskToCheck.pool || this.translate.instant('N/A');
  }
}
