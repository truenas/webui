import {
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../../../../services/storage.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import helptext from '../../../../../helptext/storage/volumes/manager/vdev';

@Component({
  selector : 'app-vdev',
  templateUrl : 'vdev.component.html',
  styleUrls : [ 'vdev.component.css' ],
})
export class VdevComponent implements OnInit {

  @Input() index: any;
  @Input() group: string;
  @Input() manager: any;
  @Input() initial_values = {};
  @ViewChild('dnd', { static: true}) dnd;
  @ViewChild(DatatableComponent, { static: false}) table: DatatableComponent;
  public type: string;
  public removable: boolean = true;
  public disks: Array<any> = [];
  public selected: Array < any > = [];
  public id: number;
  public size;
  public rawSize = 0;
  public firstdisksize;
  public error;
  public diskSizeErrorMsg = helptext.vdev_diskSizeErrorMsg;
  public vdev_type_tooltip = helptext.vdev_type_tooltip;
  public vdev_size_error = helptext.vdev_size_error;
  public vdev_size_error_2 = helptext.vdev_size_error_2;
  public vdev_disks_error;
  public vdev_disks_size_error;
  public vdev_type_disabled = false;
  protected mindisks = {'stripe': 1, 'mirror':2, 'raidz':3, 'raidz2':4, 'raidz3':5}

  public startingHeight: any;
  public expandedRows: any;

  constructor(public elementRef: ElementRef,
    public translate: TranslateService,
    public sorter: StorageService) {}

  ngOnInit() {
    this.estimateSize();
    if (this.group === 'data') {
      this.vdev_type_disabled = !this.manager.isNew;
      if (!this.vdev_type_disabled) {
        this.type = 'stripe';
      }
    } else {
      this.type = this.group;
    }
    if (this.initial_values['disks']) {
      for (let i = 0; i < this.initial_values['disks'].length; i++) {
        this.addDisk(this.initial_values['disks'][i]);
        this.manager.removeDisk(this.initial_values['disks'][i]);
      }
      this.initial_values['disks'] = [];
    }
    if (this.initial_values['type']) {
      this.type = this.initial_values['type'];
    }
  }

  getType() {
    if (this.type === undefined) {
      this.type = this.manager.first_data_vdev_type;
    }
    return helptext.vdev_types[this.type];
  }

  getTitle() {
    return "Vdev " + (this.index + 1) + ": " + this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }

  addDisk(disk: any) {
    this.disks.push(disk);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
  }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
    this.manager.getCurrentLayout();
  }

  guessVdevType() {
    if (this.group === "data" && !this.vdev_type_disabled) {
      if (this.disks.length === 2) {
        this.type = "mirror";
      } else if (this.disks.length === 3) {
        this.type = "raidz";
      } else if (this.disks.length >= 4 && this.disks.length <= 8 ) {
        this.type = "raidz2";
      } else if (this.disks.length >= 9) {
        this.type = "raidz3";
      } else {
        this.type = "stripe";
      }
    }
  }

  estimateSize() {
    this.error = null;
    this.firstdisksize = 0;
    let totalsize = 0;
    let stripeSize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    const swapsize = 2 * 1024 * 1024 * 1024;
    this.vdev_disks_size_error = false;
    for (let i = 0; i < this.disks.length; i++) {
      const size = parseInt(this.disks[i].real_capacity, 10) - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
        this.firstdisksize = size;
      }
      if (size !== smallestdisk) {
        this.vdev_disks_size_error = true;
        this.error = this.diskSizeErrorMsg;
      }
      if (this.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
      }
    }
    if (this.group === 'data') {
      if (this.disks.length > 0 && this.disks.length < this.mindisks[this.type]) {
        this.error = this.vdev_size_error + this.mindisks[this.type] + this.vdev_size_error_2;
        this.vdev_disks_error = true;
      } else {
        this.vdev_disks_error = false;
      }
    }
    totalsize = smallestdisk * this.disks.length;
    if (this.type === "mirror") {
      estimate = smallestdisk;
    } else if (this.type === "raidz") {
      estimate = totalsize - smallestdisk;
    } else if (this.type === "raidz2") {
      estimate = totalsize - 2 * smallestdisk;
    } else if (this.type === "raidz3") {
      estimate = totalsize - 3 * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    this.rawSize =estimate;
    this.size = (<any>window).filesize(estimate, {standard : "iec"});
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  removeSelectedDisks() {
    for (let i = 0; i < this.selected.length; i++) {
      this.manager.addDisk(this.selected[i]);
      this.removeDisk(this.selected[i]);
    }
    this.selected = [];
  }

  addSelectedDisks() {
    for (let i = 0; i < this.manager.selected.length; i++) {
      this.addDisk(this.manager.selected[i]);
      this.manager.removeDisk(this.manager.selected[i]);
    }
    this.manager.selected = [];
  }

  getDisks() { return this.disks; }

  onTypeChange(e) {
    this.estimateSize();
    this.manager.getCurrentLayout();
    //console.log(e, this.group);
  }

  getRawSize() {
    return this.rawSize;
  }

  remove() {
    while (this.disks.length > 0) {
      this.manager.addDisk(this.disks.pop());
    }
    this.manager.removeVdev(this);
  }

  reorderEvent(event) {
    let sort = event.sorts[0],
      rows = this.disks;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
  }

  toggleExpandRow(row) {
    //console.log('Toggled Expand Row!', row);
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }  
    this.table.rowDetail.toggleExpandRow(row);
    setTimeout(() => {
      this.expandedRows = (document.querySelectorAll('.datatable-row-detail').length);
      const newHeight = (this.expandedRows * 100) + this.startingHeight;
      const heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 100)
    
  }
}
