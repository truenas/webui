import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-alertservice-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class AlertServiceListComponent implements EntityTableConfig<AlertService> {
  title = 'Alert Services';
  route_add_tooltip = 'Add Alert Service';
  queryCall = 'alertservice.query' as const;
  wsDelete = 'alertservice.delete' as const;
  protected route_success: string[] = ['system', 'alertservice'];
  route_add: string[] = ['system', 'alertservice', 'add'];
  route_edit: string[] = ['system', 'alertservice', 'edit'];

  columns = [
    { name: 'Service Name', prop: 'name', always_display: true },
    { name: 'Type', prop: 'type' },
    { name: 'Level', prop: 'level' },
    { name: 'Enabled', prop: 'enabled', selectable: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Alert Service',
      key_props: ['name'],
    },
  };

  private providerList = [
    AlertServiceType.AwsSns,
    AlertServiceType.Mail,
    AlertServiceType.InfluxDb,
    AlertServiceType.Mattermost,
    AlertServiceType.OpsGenie,
    AlertServiceType.PagerDuty,
    AlertServiceType.Slack,
    AlertServiceType.SnmpTrap,
    AlertServiceType.Telegram,
    AlertServiceType.VictorOps,
  ];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
  ) { }

  isActionVisible(actionId: string, row: AlertService): boolean {
    if (actionId === 'edit' && !this.providerList.includes(row.type)) {
      return false;
    }
    return true;
  }

  onCheckboxChange(row: AlertService): void {
    row.enabled = !row.enabled;
    this.ws.call('alertservice.update', [row.id, { enabled: row.enabled }])
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          if (!res) {
            row.enabled = !row.enabled;
          }
        },
        (err) => {
          row.enabled = !row.enabled;
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
  }
}
