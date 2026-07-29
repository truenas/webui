import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnDialog,
  TnDividerComponent,
  TnEmptyComponent,
  TnSortEvent,
  TnTableComponent,
  TnTablePagerComponent,
  TnTableColumnDirective,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnHeaderCellDefDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import {
  filter, forkJoin, map, Subject, switchMap, take, tap,
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
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
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
import { UnlockSedDialog } from 'app/pages/storage/modules/disks/components/disk-list/unlock-sed-dialog/unlock-sed-dialog.component';
import { DiskWipeDialog } from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status.utils';
import { LicenseService } from 'app/services/license.service';

/** A hidden column surfaced in a row's expanded details. */
interface HiddenColumnDetail {
  title: string;
  value: string;
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
    TnDividerComponent,
    TnEmptyComponent,
    RequiresRolesDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class DiskListComponent implements OnInit {
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private licenseService = inject(LicenseService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DiskWrite];
  protected readonly searchableElements = diskListElements;

  // tn-button is not in the library's icon forwarding manifest, so a static
  // icon="..." would be invisible to the sprite extractor. Mark them here.
  protected readonly editIcon = tnIconMarker('pencil', 'mdi');
  protected readonly wipeIcon = tnIconMarker('delete-sweep', 'mdi');
  protected readonly unlockIcon = tnIconMarker('lock-open-variant', 'mdi');
  protected readonly resetSedIcon = tnIconMarker('restart', 'mdi');

  protected diskUpdates$ = new Subject<DiskFormResponse[number]>();

  protected readonly searchQuery = signal('');
  protected readonly selectedDisks = signal<Disk[]>([]);

  /**
   * Column metadata only — cells render through the `tnCellDef` templates. The
   * picker reads `title`/`hidden`, and `toDisplayedColumns` reads `propertyName`.
   */
  protected readonly columns = signal(createTable<Disk>([
    textColumn({ title: this.translate.instant('Name'), propertyName: 'name' }),
    textColumn({ title: this.translate.instant('Serial'), propertyName: 'serial' }),
    textColumn({
      title: this.translate.instant('Disk Size'),
      propertyName: 'size',
      getValue: (disk) => buildNormalizedFileSize(disk.size),
    }),
    textColumn({ title: this.translate.instant('Pool'), propertyName: 'pool' }),
    textColumn({ title: this.translate.instant('Disk Type'), propertyName: 'type', hidden: true }),
    textColumn({ title: this.translate.instant('Description'), propertyName: 'description', hidden: true }),
    textColumn({ title: this.translate.instant('Model'), propertyName: 'model', hidden: true }),
    textColumn({ title: this.translate.instant('Transfer Mode'), propertyName: 'transfermode', hidden: true }),
    textColumn({ title: this.translate.instant('Rotation Rate (RPM)'), propertyName: 'rotationrate', hidden: true }),
    textColumn({
      title: this.translate.instant('HDD Standby'),
      propertyName: 'hddstandby',
      getValue: (disk) => this.formatHddStandby(disk),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (disk) => this.formatAdvPowerMgmt(disk),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Self-Encrypting Drive (SED)'),
      propertyName: 'sed_status',
      getValue: (disk) => this.formatSedStatus(disk),
      hidden: true,
    }),
  ], {
    uniqueRowTag: (row) => `disk-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Disk')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  private disks: Disk[] = [];
  private unusedDisks: DetailsDisk[] = [];

  /**
   * SED columns and the `sed_status` extra are only meaningful on licensed systems,
   * so the whole request hangs off `hasSed$`.
   */
  private readonly request$ = this.licenseService.hasSed$.pipe(
    take(1),
    tap((hasSed) => {
      if (hasSed) {
        this.columns.update((columns) => columns.map((column) => {
          return column.propertyName === 'sed_status' ? { ...column, hidden: false } : column;
        }));
      }
    }),
    switchMap((hasSed) => {
      const extraOptions: ExtraDiskQueryOptions = {
        extra: {
          pools: true,
          passwords: true,
          ...(hasSed && { sed_status: true }),
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
      ]);
    }),
    map(([unusedDisks, disks]) => {
      this.unusedDisks = unusedDisks;
      this.disks = disks.map((disk) => ({
        ...disk,
        pool: this.getPoolColumn(disk),
      }));
      return this.disks;
    }),
  );

  readonly dataProvider = new AsyncDataProvider<Disk>(this.request$);

  protected readonly currentPage = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);

  protected readonly currentPageCount = computed(() => this.currentPage().length);

  protected readonly emptyType = computed(() => {
    if (this.isLoading()) {
      return EmptyType.Loading;
    }
    return this.searchQuery() ? EmptyType.NoSearchResults : EmptyType.NoPageData;
  });

  protected readonly editSelectedLabel = computed(() => {
    return this.selectedDisks().length === 1
      ? this.translate.instant('Edit Disk')
      : this.translate.instant('Edit Disks');
  });

  ngOnInit(): void {
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

  protected trackByIdentifier(index: number, disk: Disk): string {
    return disk.identifier;
  }

  protected formatSize(disk: Disk): string {
    return buildNormalizedFileSize(disk.size);
  }

  protected formatHddStandby(disk: Disk): string {
    return disk.hddstandby === DiskStandby.AlwaysOn
      ? this.translate.instant('Always On')
      : disk.hddstandby;
  }

  protected formatAdvPowerMgmt(disk: Disk): string {
    return disk.advpowermgmt === DiskPowerLevel.Disabled
      ? this.translate.instant('Disabled')
      : disk.advpowermgmt;
  }

  protected formatSedStatus(disk: Disk): string {
    return this.translate.instant(sedStatusLabel(disk));
  }

  /** Values of the currently-hidden columns, surfaced in a row's expanded details. */
  protected hiddenColumnDetails(disk: Disk): HiddenColumnDetail[] {
    return this.columns()
      .filter((column) => column.hidden && !!column.title)
      .map((column) => ({
        title: column.title,
        value: column.getValue
          ? String(column.getValue(disk) ?? '')
          : String(disk[column.propertyName] ?? ''),
      }));
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  protected onSelectionChange(disks: Disk[]): void {
    this.selectedDisks.set(disks);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Disk>(event, this.displayedColumns()));
  }

  protected edit(disks: Disk[]): void {
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
