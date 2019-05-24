import { Component, OnInit, AfterViewInit, Input, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';

@Component({
  selector: 'tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css']
})

export class TabContentComponent implements AfterViewInit, OnDestroy {

  @Input() data: any;

  constructor(public el:ElementRef/*, private ngZone: NgZone*/) { 
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(){
  }

}
