import {
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import * as filesize from 'filesize';
import helptext from 'app/helptext/storage/volumes/manager/vdev';
import { ManagerDisk } from 'app/pages/storage/volumes/manager/manager-disk.interface';
import { ManagerComponent } from 'app/pages/storage/volumes/manager/manager.component';
import { StorageService } from 'app/services/storage.service';

@Component({
  selector: 'app-vdev',
  templateUrl: 'vdev.component.html',
  styleUrls: ['vdev.component.scss'],
})
export class VdevComponent implements OnInit {
  @Input() index: number;
  @Input() group: string;
  @Input() manager: ManagerComponent;
  @Input() initial_values: any = {};
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  type: string;
  removable = true;
  disks: ManagerDisk[] = [];
  selected: ManagerDisk[] = [];
  id: number;
  size: string;
  rawSize = 0;
  firstdisksize: number;
  error: string;
  diskSizeErrorMsg = helptext.vdev_diskSizeErrorMsg;
  vdev_type_tooltip = helptext.vdev_type_tooltip;
  vdev_disks_error: boolean;
  showDiskSizeError: boolean;
  vdev_type_disabled = false;
  private ten_mib = 10 * 1024 * 1024;
  protected mindisks: any = {
    stripe: 1, mirror: 2, raidz: 3, raidz2: 4, raidz3: 5,
  };

  startingHeight: number;
  expandedRows: number;

  constructor(public elementRef: ElementRef,
    public translate: TranslateService,
    public sorter: StorageService) {}

  ngOnInit(): void {
    if (this.group === 'data') {
      this.vdev_type_disabled = !this.manager.isNew;
      if (!this.vdev_type_disabled) {
        this.type = 'stripe';
      }
    } else {
      this.type = 'stripe';
    }
    if (this.initial_values['disks']) {
      this.initial_values['disks'].forEach((disk: ManagerDisk) => {
        this.addDisk(disk);
        this.manager.removeDisk(disk);
      });
      this.initial_values['disks'] = [];
    }
    if (this.initial_values['type']) {
      this.type = this.initial_values['type'];
    }
    this.estimateSize();
  }

  getType(): string {
    if (this.type === undefined) {
      this.type = this.manager.firstDataVdevType;
    }

    // TODO: Enum
    return helptext.vdev_types[this.type as keyof typeof helptext.vdev_types];
  }

  getTitle(): string {
    return 'Vdev ' + (this.index + 1) + ': ' + this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }

  addDisk(disk: ManagerDisk): void {
    this.disks.push(disk);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
  }

  removeDisk(disk: ManagerDisk): void {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.manager.getCurrentLayout();
  }

  guessVdevType(): void {
    if (this.group === 'data' && !this.vdev_type_disabled) {
      if (this.disks.length === 2) {
        this.type = 'mirror';
      } else if (this.disks.length === 3) {
        this.type = 'raidz';
      } else if (this.disks.length >= 4 && this.disks.length <= 8) {
        this.type = 'raidz2';
      } else if (this.disks.length >= 9) {
        this.type = 'raidz3';
      } else {
        this.type = 'stripe';
      }
    }
    if (this.group === 'special' && !this.vdev_type_disabled) {
      if (this.disks.length >= 2) {
        this.type = 'mirror';
      } else {
        this.type = 'stripe';
      }
    }
  }

  estimateSize(): void {
    this.error = null;
    this.firstdisksize = 0;
    let totalsize = 0;
    let stripeSize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    const swapsize = this.manager.swapondrive * 1024 * 1024 * 1024;
    this.showDiskSizeError = false;
    for (let i = 0; i < this.disks.length; i++) {
      const size = this.disks[i].real_capacity - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
        this.firstdisksize = size;
      }
      if (size > smallestdisk + this.ten_mib || size < smallestdisk - this.ten_mib) {
        this.showDiskSizeError = true;
      }
      if (this.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
      }
    }
    if (this.group === 'data') {
      if (this.disks.length > 0 && this.disks.length < this.mindisks[this.type]) {
        this.error = this.translate.instant(
          'This type of VDEV requires at least {n, plural, one {# disk} other {# disks}}.',
          { n: this.mindisks[this.type] },
        );
        this.vdev_disks_error = true;
      } else {
        this.vdev_disks_error = false;
      }
    }
    totalsize = smallestdisk * this.disks.length;

    if (this.type === undefined) { // do the same as getType() to prevent issues while repeating
      this.type = this.manager.firstDataVdevType;
    }
    if (this.type === 'mirror') {
      estimate = smallestdisk;
    } else if (this.type === 'raidz') {
      estimate = totalsize - smallestdisk;
    } else if (this.type === 'raidz2') {
      estimate = totalsize - 2 * smallestdisk;
    } else if (this.type === 'raidz3') {
      estimate = totalsize - 3 * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    this.rawSize = estimate;
    this.size = filesize(estimate, { standard: 'iec' });
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

  getRawSize(): number {
    return this.rawSize;
  }

  remove(): void {
    while (this.disks.length > 0) {
      this.manager.addDisk(this.disks.pop());
    }
    this.manager.removeVdev(this);
  }

  reorderEvent(event: any): void {
    const sort = event.sorts[0];
    const rows = this.disks;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
  }

  toggleExpandRow(row: any): void {
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
