import {
  Component, ElementRef, Input, OnInit,
} from '@angular/core';
import * as filesize from 'filesize';

@Component({
  selector: 'app-disk',
  templateUrl: './disk.component.html',
  styles: [
    'span { float: left; display:inline-block; margin:.05em;} .fa-25 { font-size:2em; color:#1384c0; text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.4); }',
  ],
})
export class DiskComponent implements OnInit {
  @Input() data: any;
  capacity: string;

  constructor(public elementRef: ElementRef) {}

  ngOnInit(): void {
    this.capacity = filesize(this.data.capacity, { standard: 'iec' });
  }
}
