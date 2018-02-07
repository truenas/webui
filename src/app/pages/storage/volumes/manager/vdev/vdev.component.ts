import {
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChild
} from '@angular/core';


@Component({
  selector : 'app-vdev',
  templateUrl : 'vdev.component.html',
  styleUrls : [ 'vdev.component.css' ],
})
export class VdevComponent implements OnInit {

  @Input() index: any;
  @Input() group: string;
  @Input() manager: any;
  @ViewChild('dnd') dnd;
  public type: string;
  public removable: boolean = true;
  public disks: Array<any> = [];
  public selected: Array < any > = [];
  public id: number;
  public size;

  public vdev_type_tooltip = '';

  constructor(public elementRef: ElementRef) {}

  ngOnInit() {
    this.estimateSize();
    if (this.group === 'data') {
      this.type = 'stripe';
    } else {
      this.type = this.group;
    }
  }

  getTitle() {
    return "Vdev " + (this.index + 1) + ": " + this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }

  addDisk(disk: any) { 
    this.disks.push(disk);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
  }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.guessVdevType();
    this.estimateSize();
  }

  guessVdevType() {
    if (this.group === "data") {
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
    let totalsize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    let swapsize = 2 * 1024 * 1024 * 1024;
    for (let i = 0; i < this.disks.length; i++) {
      let size = parseInt(this.disks[i].real_capacity, 10) - swapsize;
      if (i === 0 || this.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
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
      estimate = totalsize; // stripe
    }
        
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
    //console.log(e, this.group);
  }

  remove() { 
    while (this.disks.length > 0) { 
      this.manager.addDisk(this.disks.pop());
    }
    this.manager.removeVdev(this);
  }
}
