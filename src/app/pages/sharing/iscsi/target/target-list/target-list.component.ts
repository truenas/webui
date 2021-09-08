import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { AppLoaderService, ModalService, WebSocketService } from 'app/services';
import { IscsiService } from 'app/services/iscsi.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-target-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
  providers: [IscsiService],
})
export class TargetListComponent implements EntityTableConfig, OnInit {
  @Input('fcEnabled') fcEnabled: boolean;

  tableTitle = 'Targets';
  queryCall: 'iscsi.target.query' = 'iscsi.target.query';
  wsDelete: 'iscsi.target.delete' = 'iscsi.target.delete';
  route_add: string[] = ['sharing', 'iscsi', 'target', 'add'];
  route_add_tooltip = 'Add Target';
  route_edit: string[] = ['sharing', 'iscsi', 'target', 'edit'];

  columns = [
    {
      name: T('Target Name'),
      prop: 'name',
      always_display: true,
    },
    {
      name: T('Target Alias'),
      prop: 'alias',
    },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Target',
      key_props: ['name'],
    },
  };

  protected entityList: EntityTableComponent;
  constructor(
    private iscsiService: IscsiService,
    private modalService: ModalService,
    private router: Router,
    private aroute: ActivatedRoute,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    if (this.fcEnabled) {
      this.columns.push({
        name: T('Mode'),
        prop: 'mode',
      });
    }
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  doAdd(rowId: string = null): void {
    this.modalService.open(
      'slide-in-form',
      new TargetFormComponent(
        this.router,
        this.aroute,
        this.iscsiService,
        this.loader,
        this.translate,
        this.ws,
        this.modalService,
      ),
      rowId,
    );
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  doEdit(id: string): void {
    this.doAdd(id);
  }

  getActions(row: IscsiTarget): EntityTableAction<IscsiTarget>[] {
    return [{
      id: row.name,
      icon: 'edit',
      name: 'edit',
      label: T('Edit'),
      onClick: (rowinner: IscsiTarget) => { this.entityList.doEdit(rowinner.id); },
    }, {
      id: row.name,
      icon: 'delete',
      name: 'delete',
      label: T('Delete'),
      onClick: (rowinner: IscsiTarget) => {
        let deleteMsg = this.entityList.getDeleteMessage(rowinner);
        this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
          (res) => {
            const payload: [id: number, force?: boolean] = [rowinner.id];
            let warningMsg = '';
            for (let i = 0; i < res.length; i++) {
              if (res[i].target.split(':')[1] == rowinner.name) {
                warningMsg = '<font color="red">' + T('Warning: iSCSI Target is already in use.</font><br>');
                payload.push(true); // enable force delele
                break;
              }
            }
            deleteMsg = warningMsg + deleteMsg;

            this.entityList.dialogService.confirm({
              title: T('Delete'),
              message: deleteMsg,
              buttonMsg: T('Delete'),
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.entityList.loader.open();
              this.entityList.loaderOpen = true;
              this.entityList.ws.call(this.wsDelete, payload).pipe(untilDestroyed(this)).subscribe(
                () => { this.entityList.getData(); },
                (resinner: WebsocketError) => {
                  new EntityUtils().handleWSError(this, resinner, this.entityList.dialogService);
                  this.entityList.loader.close();
                },
              );
            });
          },
        );
      },
    }] as EntityTableAction[];
  }
}
