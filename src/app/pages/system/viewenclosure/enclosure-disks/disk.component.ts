import { Component, OnInit, AfterViewInit, Input, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';

@Component({
  selector: 'disk-ui',
  template: `
    <div class="disk-ui-wrapper">
      <div class="disk-ui-type">
        {{data.type}}
      </div>
      <div class="disk-ui-icon">
        <mat-icon class="disk-icon" role="img" fontSet="mdi-set" fontIcon="mdi-harddisk"></mat-icon>
      </div>
      <div class="disk-ui-name">
        {{data.name}}
      </div>
    </div>
  `,
  styles: [`
    .disk-ui-wrapper{
      cursor:default;
      background: #fff;
      width:50px;
      border:solid 1px var(--bg1);
    }

    .disk-ui-name,
    .disk-ui-type{
      background: var(--bg1);
      color: var(--fg1);
      font-size:12px;
      text-align:center;
      padding:2px 0;
    }

    .disk-ui-icon{
      text-align:left;
      font-size: 59px;
      line-height:59px;
      color:#666;
    }

    .disk-ui-icon mat-icon{
      position:relative;
      left:-5px;
    }
  `]
})

export class DiskComponent implements AfterViewInit, OnDestroy {

  @Input() data: any;

  constructor(public el:ElementRef/*, private ngZone: NgZone*/) { 
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(){
  }

}
