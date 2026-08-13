import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnDetailRowDefDirective, TnDialog, TnEmptyComponent,
  TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
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
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { IxTableDetailsRowComponent } from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns,
} from 'app/modules/tn-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';
import { reflectSortIntoTable, restrictToSingleExpandedRow } from 'app/modules/tn-table/utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskBulkEditComponent } from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent, DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { diskListElements } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.elements';
import { ResetSedDialog } from 'app/pages/storage/modules/disks/components/disk-list/reset-sed-dialog/reset-sed-dialog.component';
import { UnlockSedDialog } from 'app/pages/storage/modules/disks/components/disk-list/unlock-sed-dialog/unlock-sed-dialog.component';
import { DiskWipeDialog } from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status-label.utils';
import { LicenseService } from 'app/services/license.service';
import { column } from 'app/modules/tn-table/column-configs';

/**
 * A disk row with every display-only value resolved once, when the rows are built, so
 * translation and size formatting don't re-run per row per change detection. A runtime language
 * switch therefore reaches these only on the next reload — as it does the column titles, which
 * every list in the app builds with `translate.instant` at construction.
 */
interface DiskRow extends Disk {
  sizeText: string;
  sedStatusText: string;
  hddStandbyText: string;
  advPowerManagementText: string;
}

/**
 * Sort key for HDD Standby: minutes, with "Always On" (never spins down) after every interval and
 * a disk that reports no value at all (NVMe) before every one. The missing case is checked
 * explicitly — left to `Number`, `null` would coerce to `0` and `undefined` to `NaN`, which lodash
 * `sortBy` places arbitrarily.
 */
function toStandbyOrder(value: DiskStandby | null | undefined): number {
  if (value === DiskStandby.AlwaysOn) {
    return Infinity;
  }
  // `!value` covers null, undefined and '': every real standby value is a non-empty string.
  if (!value) {
    return -1;
  }
  const minutes = Number(value);
  return Number.isFinite(minutes) ? minutes : -1;
}

/** Sort key for Adv. Power Management: level, with "Disabled" and a missing value below every one. */
function toPowerLevelOrder(value: DiskPowerLevel | null | undefined): number {
  // `!value` covers null, undefined and '': every real power level is a non-empty string.
  if (value === DiskPowerLevel.Disabled || !value) {
    return -1;
  }
  const level = Number(value);
  return Number.isFinite(level) ? level : -1;
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

  // Remembered so the header arrow survives a table rebuild; see `reflectSortIntoTable`.
  private readonly activeSort = signal<TnSortEvent | null>(null);

  // By identifier, not row reference: a save rebuilds every row object.
  //
  // Behavior change: the pre-migration screen kept a page-1 selection alive while you paged or
  // searched, but tn-table clears its own selection whenever `[dataSource]` changes, so a
  // selection now covers only the rows on screen and the checkboxes and batch bar always agree.
  // Keeping that true is the job of `clearSelectionWhenRowsChange`.
  private readonly selectedIdentifiers = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedDisks = computed(
    () => this.rows().filter((disk) => this.selectedIdentifiers().has(disk.identifier)),
  );

  // Rendered twice — visibly in the batch bar and, for screen readers, in the live region that
  // outlives it — so the two can't word the count differently.
  protected readonly selectionCountText = computed(() => this.translate.instant(
    '{n, plural, one {# disk selected} other {# disks selected}}',
    { n: this.selectedDisks().length },
  ));

  /** Flipped by the first selection and never reset — see {@link selectionAnnouncement}. */
  private readonly hasSelectedBefore = signal(false);

  /**
   * What the live region says. Silent until the first selection, because a region that enters
   * the DOM already populated isn't announced — after that it closes the loop in both
   * directions, naming the count and saying so when the last disk is deselected (or when a
   * search or page drops the selection) rather than going quiet with nothing explaining why.
   */
  protected readonly selectionAnnouncement = computed(() => {
    if (this.selectedDisks().length) {
      return this.selectionCountText();
    }
    return this.hasSelectedBefore() ? this.translate.instant('No disks selected') : '';
  });

  // The ix-table column model is retained purely as picker metadata (visibility + saved
  // preferences) and to drive the hidden-column readout inside the expanded detail row;
  // tn-table renders its own cells from the templates below.
  protected readonly columns = signal(createTable<DiskRow>([
    column({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    column({
      title: this.translate.instant('Serial'),
      propertyName: 'serial',
    }),
    column({
      title: this.translate.instant('Disk Size'),
      propertyName: 'size',
      getValue: (disk) => disk.sizeText,
      // Sort by the raw byte count, not by the formatted "5 GiB" text.
      sortBy: (disk) => disk.size,
    }),
    column({
      title: this.translate.instant('Pool'),
      propertyName: 'pool',
    }),
    column({
      title: this.translate.instant('Disk Type'),
      propertyName: 'type',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Model'),
      propertyName: 'model',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Transfer Mode'),
      propertyName: 'transfermode',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Rotation Rate (RPM)'),
      propertyName: 'rotationrate',
      hidden: true,
    }),
    column({
      title: this.translate.instant('HDD Standby'),
      propertyName: 'hddstandby',
      getValue: (row) => row.hddStandbyText,
      // The enum's values are minute counts held as strings, so sorting the rendered text puts
      // "120" before "20". Order by the number, with "Always On" (never spins down) last and a
      // disk that reports no standby value at all (NVMe) first — `Number(undefined)` is NaN,
      // which lodash orders unpredictably.
      sortBy: (row) => toStandbyOrder(row.hddstandby),
      hidden: true,
    }),
    column({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (row) => row.advPowerManagementText,
      // Same as HDD Standby: numeric levels stored as strings would sort "64" after "254".
      // "Disabled" (no power management at all) sorts below every level, as does a disk that
      // reports no level (NaN otherwise).
      sortBy: (row) => toPowerLevelOrder(row.advpowermgmt),
      hidden: true,
    }),
    column({
      title: this.translate.instant('Self-Encrypting Drive (SED)'),
      propertyName: 'sed_status',
      // The row's resolved status text, so the hidden-column readout in the details row shows
      // exactly what the table cell does — a live `| translate` there would drift from the
      // frozen cell text after a runtime language switch.
      getValue: (row) => row.sedStatusText,
      // Sort by that translated status, not by the raw SedStatus enum.
      sortBy: (row) => row.sedStatusText,
      hidden: !this.hasSed(),
    }),
  ]));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<TableColumn<DiskRow>[]>(
    () => this.columns().filter((column) => column?.hidden),
  );

  protected readonly trackByIdentifier = (_: number, row: DiskRow): string => row.identifier;

  constructor() {
    restrictToSingleExpandedRow(this.table);
    reflectSortIntoTable(this.table, this.activeSort);
    this.clearSelectionWhenRowsChange();

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
    if (disks.length) {
      this.hasSelectedBefore.set(true);
    }
    this.selectedIdentifiers.set(new Set(disks.map((disk) => disk.identifier)));
  }

  /**
   * Test-id fragment for a row's action buttons. A method rather than a {@link DiskRow} field
   * so `toDisk` doesn't have to strip a test-id concern back off.
   */
  protected testIdTag(row: DiskRow): string {
    return normalizeTestIdString(row.name);
  }

  protected onRowClick(row: DiskRow): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.activeSort.set(event);
    // Pass the column model so the derived columns keep sorting by their displayed
    // text (and Disk Size by its raw byte count), the way ix-table's head did.
    this.dataProvider.setSorting(mapTnSortToTableSort(event, this.displayedColumns(), { columns: this.columns() }));
  }

  protected onColumnsChange(columns: TableColumn<DiskRow>[]): void {
    this.columns.set([...columns]);
  }

  protected onEmptyAction(): void {
    if (this.emptyType() === EmptyType.NoSearchResults) {
      this.onListFiltered('');
      return;
    }

    this.reload();
  }

  /**
   * Drops the selection the moment the displayed rows change — a search, a page, a sort, a
   * reload, or the optimistic `setRows` after a save.
   *
   * tn-table does the same to its own checkboxes: an internal effect on its `data()` computed
   * clears its `SelectionModel` and emits `(selectionChange)` with an empty list whenever the
   * `[dataSource]` reference changes. That model holds row *references*, not `[trackBy]` keys,
   * so rebuilding the rows with the same identifiers unticks them too. This mirrors that in our
   * own state rather than depending on the emission: the selection is held by identifier, and a
   * row that left the page and came back (search then Reset, page 2 then page 1) would otherwise
   * return already selected in the batch bar with its checkbox unticked — and Edit would act on
   * a disk the user never picked.
   */
  private clearSelectionWhenRowsChange(): void {
    effect(() => {
      this.rows();
      untracked(() => this.selectedIdentifiers.set(new Set()));
    });
  }

  /** Reloads the list. The selection goes with it — see {@link clearSelectionWhenRowsChange}. */
  private reload(): void {
    this.selectedIdentifiers.set(new Set());
    this.dataProvider.load();
  }

  protected edit(rows: DiskRow[]): void {
    const disks = rows.map((row) => toDisk(row));
    const result$ = disks.length > 1
      ? this.formPanel.open<DiskFormResponse>(DiskBulkEditComponent, {
          title: this.translate.instant('Bulk Edit Disks'),
          inputs: { disksToEdit: disks },
        })
      : this.formPanel.open<DiskFormResponse>(DiskFormComponent, {
          title: this.translate.instant('Edit Disk'),
          inputs: { diskToEdit: disks[0] },
        });

    result$.onSuccess((response) => {
      // this gets the updated disk data from the disk edit form (both single and bulk)
      // and emits it over `diskUpdates$`.
      response.forEach((upd) => this.diskUpdates$.next(upd));
      this.reload();
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
      this.reload();
    });
  }

  protected unlock(disk: Disk): void {
    this.tnDialog.open(UnlockSedDialog, {
      data: { diskName: disk.name },
    }).closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reload();
    });
  }

  protected resetSed(disk: Disk): void {
    this.tnDialog.open(ResetSedDialog, {
      data: { diskName: disk.name },
    }).closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reload();
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
