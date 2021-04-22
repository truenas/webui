import { Component } from '@angular/core';

import { FibreChannelPortComponent } from './fibre-channel-port/fibre-channel-port.component';

@Component({
  selector: 'app-iscsi-fibre-channel-ports',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class FibreChannelPortsComponent {
  title = 'Fibre Channel';
  protected queryCall = 'fcport.query';
  protected entityList: any;

  columns: any[] = [
    { name: 'Name', prop: 'name', always_display: true },
    { name: 'WWPN', prop: 'wwpn' },
    { name: 'State', prop: 'state' },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected showActions = false;
  protected hasDetails = true;
  protected rowDetailComponent = FibreChannelPortComponent;
  protected detailRowHeight = 350;
}
