import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, forkJoin, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Choices } from 'app/interfaces/choices.interface';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { DiskBulkEditComponent } from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { diskListElements } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.elements';
import { DiskWipeDialogComponent } from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { ManualTestDialogComponent, ManualTestDialogParams } from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
        this.disks.forEach((disk) => disk.selected = checked);
        this.dataProvider.setRows([]);
        this.onListFiltered(this.filterString);
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
      getValue: (row) => (buildNormalizedFileSize(row.size)),
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
      getValue: (row) => this.translate.instant(stringToTitleCase(row.hddstandby)),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Adv. Power Management'),
      propertyName: 'advpowermgmt',
      getValue: (row) => this.translate.instant(stringToTitleCase(row.advpowermgmt)),
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
    private slideInService: IxSlideInService,
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
    });
  }

  goToTestResults(disk: Disk): void {
    this.router.navigate(['/storage', 'disks', 'smartresults', SmartTestResultPageType.Disk, disk.name]);
  }

  edit(disks: DiskUi[]): void {
    const preparedDisks = this.prepareDisks(disks);
    let slideInRef: IxSlideInRef<DiskBulkEditComponent | DiskFormComponent>;

    if (preparedDisks.length > 1) {
      slideInRef = this.slideInService.open(DiskBulkEditComponent);
      (slideInRef as IxSlideInRef<DiskBulkEditComponent>).componentInstance.setFormDiskBulk(preparedDisks);
    } else {
      slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
      (slideInRef as IxSlideInRef<DiskFormComponent>).componentInstance.setFormDisk(preparedDisks[0]);
    }

    slideInRef.slideInClosed$.pipe(
      filter((response) => Boolean(response)),
      untilDestroyed(this),
    ).subscribe(() => this.dataProvider.load());
  }

  wipe(disk: Disk): void {
    const exportedPool = this.unusedDisks.find((dev) => dev.devname === disk.devname)?.exported_zpool;
    this.matDialog.open(DiskWipeDialogComponent, {
      data: {
        diskName: disk.name,
        exportedPool,
      },
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
      delete disk.selected;
      return disk as Disk;
    });
  }
}
