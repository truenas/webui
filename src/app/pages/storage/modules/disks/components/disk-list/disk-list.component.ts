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
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns,
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

  // `hasSed$` is a store selector, so this resolves synchronously at field init —
  // both the SED column's default visibility and the disk.query `extra` args read it.
  private readonly hasSed = toSignal(this.licenseService.hasSed$, { initialValue: false });

  private disks: Disk[] = [];
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
        this.disks = disks.map((disk) => ({
          ...disk,
          pool: this.getPoolColumn(disk),
        }));
        return this.disks;
      }),
    );
  });

  protected readonly dataProvider = new AsyncDataProvider<Disk>(this.disks$);

  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$, { initialValue: 0 });
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$, { initialValue: EmptyType.Loading });

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

  private readonly table = viewChild(TnTableComponent<Disk>);
  protected readonly selectedDisks = signal<Disk[]>([]);

  // tn-table allows several rows open at once and exposes no single-expand input, so restore
  // the previous ix-table behavior: whenever a second row opens, collapse back to that one.
  private previousExpandedRows = new Set<unknown>();

  // The ix-table column model is retained purely as picker metadata (visibility + saved
  // preferences) and to drive the hidden-column readout inside the expanded detail row;
  // tn-table renders its own cells from the templates below.
  protected readonly columns = signal(createTable<Disk>([
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
      getValue: (disk) => buildNormalizedFileSize(disk.size),
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
      getValue: (row) => this.hddStandbyValue(row),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (row) => this.advPowerManagementValue(row),
      hidden: true,
    }),
    sedStatusColumn({
      title: this.translate.instant('Self-Encrypting Drive (SED)'),
      propertyName: 'sed_status',
      hidden: !this.hasSed(),
    }),
  ], {
    // Still needed by the ix-table cell components the details row renders for the
    // hidden columns — they resolve their own data-test ids and aria labels from these.
    uniqueRowTag: (row) => `disk-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Disk')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<Column<Disk, ColumnComponent<Disk>>[]>(
    () => this.columns().filter((column) => column?.hidden),
  );

  protected readonly trackByIdentifier = (_: number, row: Disk): string => row.identifier;

  constructor() {
    effect(() => {
      const table = this.table();
      if (!table) {
        return;
      }
      const expanded = table.expandedRows();
      if (expanded.size <= 1) {
        this.previousExpandedRows = new Set(expanded);
        return;
      }
      const newest = [...expanded].find((row) => !this.previousExpandedRows.has(row));
      const collapsed = newest ? new Set<unknown>([newest]) : new Set<unknown>();
      this.previousExpandedRows = collapsed;
      table.expandedRows.set(collapsed);
    });

    this.dataProvider.load();

    this.diskUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((diskUpdate) => {
      // find the edited disk inside our internal representation of the disks
      // and update it to match the new params.
      this.disks = this.disks.map((disk) => {
        if (disk.identifier === diskUpdate.identifier) {
          return { ...disk, ...diskUpdate };
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

  protected hddStandbyValue(row: Disk): string {
    if (row.hddstandby === DiskStandby.AlwaysOn) {
      return this.translate.instant('Always On');
    }

    return row.hddstandby;
  }

  protected advPowerManagementValue(row: Disk): string {
    if (row.advpowermgmt === DiskPowerLevel.Disabled) {
      return this.translate.instant('Disabled');
    }

    return row.advpowermgmt;
  }

  protected diskSize(row: Disk): string {
    return buildNormalizedFileSize(row.size);
  }

  protected sedStatus(row: Disk): string {
    return this.translate.instant(sedStatusLabel(row));
  }

  /**
   * Pre-splits the disk name with lodash `kebabCase` — it breaks letter–digit boundaries
   * (`nvme0n1` → `nvme-0-n-1`) while the library's test-id kebab does not, so passing the
   * raw name would silently rename every NVMe row's action test ids.
   */
  protected diskTag(row: Disk): string {
    return kebabCase(row.name);
  }

  protected onSelectionChange(disks: Disk[]): void {
    this.selectedDisks.set(disks);
  }

  protected onRowClick(row: Disk): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Disk>(event, this.displayedColumns()));
  }

  protected onColumnsChange(columns: Column<Disk, ColumnComponent<Disk>>[]): void {
    this.columns.set([...columns]);
  }

  protected onEmptyAction(): void {
    if (this.emptyType() === EmptyType.NoSearchResults) {
      this.onListFiltered('');
      return;
    }

    this.dataProvider.load();
  }

  protected edit(disks: Disk[]): void {
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

  private getPoolColumn(diskToCheck: Disk): string {
    const unusedDisk = this.unusedDisks.find((disk) => disk.devname === diskToCheck.devname);
    if (unusedDisk?.exported_zpool) {
      return `${unusedDisk.exported_zpool} (${this.translate.instant('Exported')})`;
    }
    return diskToCheck.pool || this.translate.instant('N/A');
  }
}
