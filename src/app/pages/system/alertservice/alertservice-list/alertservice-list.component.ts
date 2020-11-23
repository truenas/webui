import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { WebSocketService, DialogService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-alertservice-list',
  template: `<entity-table [title]="title"  [conf]="this"></entity-table>`
})
export class AlertServiceListComponent {

  public title = "Alert Services";
  protected route_add_tooltip = "Add Alert Service";
  protected queryCall = 'alertservice.query';
  protected wsDelete = 'alertservice.delete';
  protected route_success: string[] = ['system', 'alertservice'];
  protected route_add: string[] = ['system', 'alertservice','add'];
  protected route_edit: string[] = ['system', 'alertservice','edit'];

  public columns: Array<any> = [
    { name: 'Service Name', prop: 'name', always_display: true },
    { name: 'Type', prop: 'type'},
    { name: 'Level', prop: 'level'},
    { name: 'Enabled', prop: 'enabled', selectable: true },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Alert Service',
      key_props: ['name']
    },
  };

  private providerList = ['AWSSNS','Mail','InfluxDB','Mattermost','OpsGenie','PagerDuty', 'Slack','SNMPTrap', 'Telegram', 'VictorOps'];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialogService: DialogService) { }
  
  isActionVisible(actionId: string, row: any) {
    if (actionId === 'edit' && this.providerList.indexOf(row.type) === -1) {
      return false;
    }
    return true;
  }

  onCheckboxChange(row) {
    row.enabled = !row.enabled;
    this.ws.call('alertservice.update', [row.id, {'enabled': row.enabled}] )
    .subscribe(
      (res) => {
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
  }
}
