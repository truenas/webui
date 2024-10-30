import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, forkJoin, map, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DiskBulkEditComponent } from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { diskListElements } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.elements';
import { DiskWipeDialogComponent } from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { ManualTestDialogComponent, ManualTestDialogParams } from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Exclude AnythingUi when NAS-127632 is done
interface DiskUi extends Disk {
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-disk-list',
  templateUrl: './disk-list.component.html',
  styleUrls: ['./disk-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    UiSearchDirective,
    MatButton,
    TestDirective,
    IxIconComponent,
    RequiresRolesDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class DiskListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = diskListElements;

  dataProvider: AsyncDataProvider<DiskUi>;
  filterString = '';

  columns = createTable<DiskUi>([
    checkboxColumn({
      propertyName: 'selected',
      onRowCheck: (row, checked) => {
        this.disks.find((disk) => row.name === disk.name).selected = checked;
        this.dataProvider.setRows([]);
        this.onListFiltered(this.filterString);
      },
      onColumnCheck: (checked) => {
        this.dataProvider.currentPage$.pipe(
          take(1),
          untilDestroyed(this),
        ).subscribe((disks) => {
          disks.forEach((disk) => disk.selected = checked);
          this.dataProvider.setRows([]);
          this.onListFiltered(this.filterString);
        });
      },
    }),
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
      getValue: (row) => {
        if (row.hddstandby === DiskStandby.AlwaysOn) {
          return this.translate.instant('Always On');
        }

        return row.hddstandby;
      },
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (row) => {
        if (row.advpowermgmt === DiskPowerLevel.Disabled) {
          return this.translate.instant('Disabled');
        }

        return row.advpowermgmt;
      },
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Enable S.M.A.R.T.'),
      propertyName: 'togglesmart',
      getValue: (row) => (row.togglesmart ? this.translate.instant('Yes') : this.translate.instant('No')),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('S.M.A.R.T. extra options'),
      propertyName: 'smartoptions',
      hidden: true,
    }),
  ], {
    uniqueRowTag: (row) => `disk-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Disk')],
  });

  get hiddenColumns(): Column<DiskUi, ColumnComponent<DiskUi>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  get selectedDisks(): DiskUi[] {
    return this.disks.filter((disk) => disk.selected);
  }

  private disks: DiskUi[] = [];
  private unusedDisks: DetailsDisk[] = [];
  private smartDiskChoices: Choices = {};

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private slideInService: SlideInService,
    protected emptyService: EmptyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const request$ = forkJoin([
      this.ws.call('disk.details').pipe(
        map((diskDetails) => [
          ...diskDetails.unused,
          ...diskDetails.used.filter((disk) => disk.exported_zpool),
        ]),
      ),
      this.ws.call('smart.test.disk_choices'),
      this.ws.call('disk.query', [[], { extra: { pools: true, passwords: true } }]),
    ]).pipe(
      map(([unusedDisks, disksThatSupportSmart, disks]) => {
        this.unusedDisks = unusedDisks;
        this.smartDiskChoices = disksThatSupportSmart;
        this.disks = disks.map((disk) => ({
          ...disk,
          pool: this.getPoolColumn(disk),
          selected: false,
        }));
        return this.disks;
      }),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.dataProvider.load();
  }

  manualTest(disks: DiskUi[]): void {
    this.matDialog.open(ManualTestDialogComponent, {
      data: {
        selectedDisks: this.prepareDisks(disks),
        diskIdsWithSmart: Object.keys(this.smartDiskChoices),
      } as ManualTestDialogParams,
      width: '600px',
    });
  }

  goToTestResults(disk: Disk): void {
    this.router.navigate(['/storage', 'disks', 'smartresults', SmartTestResultPageType.Disk, disk.name]);
  }

  edit(disks: DiskUi[]): void {
    const preparedDisks = this.prepareDisks(disks);
    let slideInRef: SlideInRef<DiskBulkEditComponent | DiskFormComponent>;

    if (preparedDisks.length > 1) {
      slideInRef = this.slideInService.open(DiskBulkEditComponent);
      (slideInRef as SlideInRef<DiskBulkEditComponent>).componentInstance.setFormDiskBulk(preparedDisks);
    } else {
      slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
      (slideInRef as SlideInRef<DiskFormComponent>).componentInstance.setFormDisk(preparedDisks[0]);
    }

    slideInRef.slideInClosed$.pipe(
      filter((response) => Boolean(response)),
      untilDestroyed(this),
    ).subscribe(() => this.dataProvider.load());
  }

  wipe(disk: Disk): void {
    const exportedPool = this.unusedDisks.find((dev) => dev.devname === disk.devname)?.exported_zpool;
    const dialog = this.matDialog.open(DiskWipeDialogComponent, {
      data: {
        diskName: disk.name,
        exportedPool,
      },
    });
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected isSmartSupported(disk: Disk): boolean {
    return Object.keys(this.smartDiskChoices).includes(disk.identifier);
  }

  protected isUnusedDisk(disk: Disk): boolean {
    return !!this.unusedDisks.find((unusedDisk) => unusedDisk.name === disk.name);
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ list: this.disks, query, columnKeys: ['name', 'pool', 'serial'] });
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private getPoolColumn(diskToCheck: Disk): string {
    const unusedDisk = this.unusedDisks.find((disk) => disk.devname === diskToCheck.devname);
    if (unusedDisk?.exported_zpool) {
      return `${unusedDisk.exported_zpool} (${this.translate.instant('Exported')})`;
    }
    return diskToCheck.pool || this.translate.instant('N/A');
  }

  private prepareDisks(disks: DiskUi[]): Disk[] {
    return disks.map((disk) => {
      const newDisk = { ...disk };
      delete newDisk.selected;
      return newDisk as Disk;
    });
  }
}
