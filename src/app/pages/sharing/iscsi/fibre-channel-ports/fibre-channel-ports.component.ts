import { Component } from '@angular/core';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { FibreChannelPortComponent } from './fibre-channel-port/fibre-channel-port.component';

@Component({
  selector: 'app-iscsi-fibre-channel-ports',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class FibreChannelPortsComponent implements EntityTableConfig {
  title = 'Fibre Channel';
  queryCall: 'fcport.query' = 'fcport.query';
  protected entityList: any;

  columns = [
    { name: 'Name', prop: 'name', always_display: true },
    { name: 'WWPN', prop: 'wwpn' },
    { name: 'State', prop: 'state' },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  showActions = false;
  hasDetails = true;
  rowDetailComponent = FibreChannelPortComponent;
  detailRowHeight = 350;
}
