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

  constructor(public elementRef: ElementRef) {}

  ngOnInit() {
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
    this.guessVdevType();
  }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.guessVdevType();
  }

  guessVdevType() {
    if (this.group === "data") {
      if (this.disks.length === 2) {
        this.type = "mirror";
      } else if (this.disks.length === 3) {
        this.type = "raidz";
      } else if (this.disks.length >= 4 && this.disks.length <= 6 ) {
        this.type = "raidz2";
      } else if (this.disks.length >= 7) {
        this.type = "raidz3";
      } else {
        this.type = "stripe";
      }
    }
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

  onTypeChange(e) { console.log(e, this.group); }

  remove() { 
    while (this.disks.length > 0) { 
      this.manager.addDisk(this.disks.pop());
    }
    this.manager.removeVdev(this);
  }
}
