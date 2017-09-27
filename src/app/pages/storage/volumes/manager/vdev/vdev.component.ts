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

  @Input() group: string;
  @Input() manager: any;
  @ViewChild('dnd') dnd;
  public type: string = 'stripe';
  public removable: boolean = true;
  public disks: Array<any> = [];
  public selected: Array < any > = [];

  constructor(public elementRef: ElementRef) {}

  ngOnInit() {}

  addDisk(disk: any) { this.disks.push(disk); }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
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

  remove() { this.manager.removeVdev(this); }
}
