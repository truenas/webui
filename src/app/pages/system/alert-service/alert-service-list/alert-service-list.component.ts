import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-service-list',
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class AlertServiceListComponent implements EntityTableConfig<AlertService> {
  title = 'Alert Services';
  routeAddTooltip = this.translate.instant('Add Alert Service');
  queryCall = 'alertservice.query' as const;
  wsDelete = 'alertservice.delete' as const;
  protected routeSuccess: string[] = ['system', 'alertservice'];
  routeAdd: string[] = ['system', 'alertservice', 'add'];
  routeEdit: string[] = ['system', 'alertservice', 'edit'];
  entityTable: EntityTableComponent<AlertService>;
  actionsOutOfHeader = true;

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
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) { }

  isActionVisible(actionId: string, row: AlertService): boolean {
    if (actionId === 'edit' && !this.providerList.includes(row.type)) {
      return false;
    }
    return true;
  }

  afterInit(entityTable: EntityTableComponent<AlertService>): void {
    this.entityTable = entityTable;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AlertServiceComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityTable.getData());
  }

  doEdit(id: number, entityTable: EntityTableComponent<AlertService>): void {
    const alertService = entityTable.rows.find((row) => row.id === id);

    const slideInRef = this.slideInService.open(AlertServiceComponent, { data: alertService });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityTable.getData());
  }

  onCheckboxChange(row: AlertService): void {
    row.enabled = !row.enabled;
    this.ws.call('alertservice.update', [row.id, { enabled: row.enabled }])
      .pipe(untilDestroyed(this)).subscribe({
        next: (alertService) => {
          if (!alertService) {
            row.enabled = !row.enabled;
          }
        },
        error: (error: WebsocketError) => {
          row.enabled = !row.enabled;
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
