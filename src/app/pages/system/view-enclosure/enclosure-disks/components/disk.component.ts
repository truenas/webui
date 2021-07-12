import {
  Component, Input, ElementRef,
} from '@angular/core';

@Component({
  selector: 'disk-ui',
  template: `
    <div class="disk-ui-wrapper">
      <div class="disk-ui-type">
        {{data.type ? data.type : 'HDD'}}
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
      border:solid 1px var(--lines);
    }

    .disk-ui-name,
    .disk-ui-type{
      background: var(--black);
      color: var(--white);
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
      top: -1px;
      left: -2px;
      font-size: 52px;
    }
  `],
})

export class DiskComponent {
  @Input() data: any;

  constructor(public el: ElementRef) {
  }
}
