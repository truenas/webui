import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DatatableComponent, SortPropDir } from '@siemens/ngx-datatable';
import * as filesize from 'filesize';
import { GiB, MiB } from 'app/constants/bytes.constant';
import helptext from 'app/helptext/storage/volumes/manager/vdev';
import { UpdatePoolTopologyGroup } from 'app/interfaces/pool.interface';
import { ManagerVdev } from 'app/pages/storage/components/manager/classes/manager-vdev.class';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { ManagerComponent } from 'app/pages/storage/components/manager/manager.component';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  selector: 'ix-vdev',
  templateUrl: 'vdev.component.html',
  styleUrls: ['vdev.component.scss'],
})
export class VdevComponent implements OnInit {
  @Input() title: string;
  @Input() uuid: string;
  @Input() group: UpdatePoolTopologyGroup;
  @Input() manager: ManagerComponent;
  @Input() initialValues = {} as { disks: ManagerDisk[]; type: string };
  @Output() vdevChanged = new EventEmitter<ManagerVdev>();
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  typeControl = new FormControl(undefined as string);
  removable = true;
  disks: ManagerDisk[] = [];
  selected: ManagerDisk[] = [];
  id: number;
  size: string;
  rawSize = 0;
  firstdisksize: number;
  error: string;
  diskSizeErrorMsg = helptext.vdev_diskSizeErrorMsg;
  vdevTypeTooltip = helptext.vdev_type_tooltip;
  vdevDisksError: boolean;
  showDiskSizeError: boolean;
  vdevTypeDisabled = false;
  private tenMib = 10 * MiB;
  protected mindisks: { [key: string]: number } = {
    stripe: 1,
    mirror: 2,
    raidz: 3,
    raidz2: 4,
    raidz3: 5,
    draid1: 2,
    draid2: 3,
    draid3: 4,
  };

  startingHeight: number;
  expandedRows: number;

  constructor(
    public translate: TranslateService,
    public sorter: StorageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.group === 'data') {
      this.vdevTypeDisabled = !this.manager.isNew;
      if (!this.vdevTypeDisabled) {
        this.typeControl.setValue('stripe');
      }
    } else {
      this.typeControl.setValue('stripe');
    }
    if (this.initialValues.disks) {
      this.initialValues.disks.forEach((disk: ManagerDisk) => {
        this.addDisk(disk);
        this.manager.removeDisk(disk);
      });
      this.initialValues.disks = [];
    }
    if (this.initialValues.type) {
      this.typeControl.setValue(this.initialValues.type);
    }
    this.estimateSize();

    this.typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.emitChangedVdev();
      this.onTypeChange();
    });

    this.cdr.markForCheck();
  }

  getType(): string {
    if (
      (this.typeControl.value === undefined || this.typeControl.value === null)
      && this.manager.firstDataVdevType !== undefined
    ) {
      this.typeControl.setValue(this.manager.firstDataVdevType);
    }

    // TODO: Enum
    return helptext.vdev_types[this.typeControl.value as keyof typeof helptext.vdev_types];
  }

  addDisk(disk: ManagerDisk): void {
    this.disks.push(disk);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
    this.emitChangedVdev();
  }

  removeDisk(disk: ManagerDisk): void {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.manager.getCurrentLayout();
  }

  emitChangedVdev(): void {
    this.vdevChanged.emit({
      disks: [...this.disks],
      type: this.typeControl.value,
      uuid: this.uuid,
      group: this.group,
      rawSize: this.rawSize,
      vdevDisksError: this.vdevDisksError,
      showDiskSizeError: this.showDiskSizeError,
    });
  }

  guessVdevType(): void {
    if (this.group === 'data' && !this.vdevTypeDisabled) {
      if (this.disks.length === 2) {
        this.typeControl.setValue('mirror');
      } else if (this.disks.length === 3) {
        this.typeControl.setValue('raidz');
      } else if (this.disks.length >= 4 && this.disks.length <= 8) {
        this.typeControl.setValue('raidz2');
      } else if (this.disks.length >= 9) {
        this.typeControl.setValue('raidz3');
      } else {
        this.typeControl.setValue('stripe');
      }
    }
    if (this.group === 'special' && !this.vdevTypeDisabled) {
      if (this.disks.length >= 2) {
        this.typeControl.setValue('mirror');
      } else {
        this.typeControl.setValue('stripe');
      }
    }
    this.cdr.detectChanges();
  }

  estimateSize(): void {
    this.error = null;
    this.firstdisksize = 0;
    let totalsize = 0;
    let stripeSize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    const swapsize = this.manager.swapondrive * GiB;
    this.showDiskSizeError = false;
    for (let i = 0; i < this.disks.length; i++) {
      const size = this.disks[i].real_capacity - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
        this.firstdisksize = size;
      }
      if (size > smallestdisk + this.tenMib || size < smallestdisk - this.tenMib) {
        this.showDiskSizeError = true;
      }
      if (this.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
      }
    }
    if (this.group === 'data') {
      if (this.disks.length > 0 && this.disks.length < this.mindisks[this.typeControl.value]) {
        this.error = this.translate.instant(
          'This type of VDEV requires at least {n, plural, one {# disk} other {# disks}}.',
          { n: this.mindisks[this.typeControl.value] },
        );
        this.vdevDisksError = true;
      } else {
        this.vdevDisksError = false;
      }
    }
    totalsize = smallestdisk * this.disks.length;
    const defaultDraidDataPerGroup = 8;

    // do the same as getType() to prevent issues while repeating
    if (this.typeControl.value === undefined || this.typeControl.value === null) {
      this.typeControl.setValue(this.manager.firstDataVdevType);
    }
    if (this.typeControl.value === 'mirror') {
      estimate = smallestdisk;
    } else if (this.typeControl.value === 'raidz') {
      estimate = totalsize - smallestdisk;
    } else if (this.typeControl.value === 'raidz2') {
      estimate = totalsize - 2 * smallestdisk;
    } else if (this.typeControl.value === 'raidz3') {
      estimate = totalsize - 3 * smallestdisk;
    } else if (this.typeControl.value === 'draid1') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, this.disks.length - 1);
      estimate = this.disks.length * (dataPerGroup / (dataPerGroup + 1)) * smallestdisk;
    } else if (this.typeControl.value === 'draid2') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, this.disks.length - 2);
      estimate = this.disks.length * (dataPerGroup / (dataPerGroup + 2)) * smallestdisk;
    } else if (this.typeControl.value === 'draid3') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, this.disks.length - 3);
      estimate = this.disks.length * (dataPerGroup / (dataPerGroup + 3)) * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    this.rawSize = estimate;
    this.size = filesize(estimate, { standard: 'iec' });
    this.emitChangedVdev();
  }

  onSelect({ selected }: { selected: ManagerDisk[] }): void {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  removeSelectedDisks(): void {
    this.selected.forEach((disk) => {
      this.manager.addDisk(disk);
      this.removeDisk(disk);
    });
    this.selected = [];
  }

  addSelectedDisks(): void {
    this.manager.selected.forEach((disk) => {
      this.addDisk(disk);
      this.manager.removeDisk(disk);
    });
    this.manager.selected = [];
  }

  getDisks(): ManagerDisk[] {
    return this.disks;
  }

  onTypeChange(): void {
    this.estimateSize();
    this.manager.getCurrentLayout();
  }

  remove(): void {
    while (this.disks.length > 0) {
      this.manager.addDisk(this.disks.pop());
    }
    this.manager.removeVdev(this);
  }

  reorderEvent(event: { sorts: SortPropDir[] }): void {
    const sort = event.sorts[0];
    const rows = this.disks;
    this.sorter.tableSorter(rows, sort.prop as keyof ManagerDisk, sort.dir);
  }

  toggleExpandRow(row: ManagerDisk): void {
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }
    this.table.rowDetail.toggleExpandRow(row);
    setTimeout(() => {
      this.expandedRows = document.querySelectorAll('.datatable-row-detail').length;
      const newHeight = (this.expandedRows * 100) + this.startingHeight;
      const heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 100);
  }
}
