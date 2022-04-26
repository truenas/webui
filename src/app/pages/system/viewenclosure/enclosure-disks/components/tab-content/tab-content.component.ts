import {
  Component, OnInit, AfterViewInit, Input, ElementRef, NgZone, OnDestroy, OnChanges,
} from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';

@Component({
  selector: 'tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css'],
})

export class TabContentComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any;

  headers = ['descriptor', 'status', 'value', 'slot'];

  constructor(public el: ElementRef/* , private ngZone: NgZone */) {
  }

  ngOnChanges() {
    if (this.data.header) {
      this.headers = this.data.header;
    } else {
      this.headers = ['descriptor', 'status', 'value', 'slot'];
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
  }
}
