import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ModalService } from 'app/services';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-target-list',
  template: `
    <entity-table [conf]="this" [title]="title"></entity-table>
  `,
  providers: [IscsiService],
})
export class TargetListComponent implements EntityTableConfig, OnInit {
  @Input() fcEnabled: boolean;

  title = this.translate.instant('Targets');
  queryCall = 'iscsi.target.query' as const;
  wsDelete = 'iscsi.target.delete' as const;
  routeAdd: string[] = ['sharing', 'iscsi', 'target', 'add'];
  routeAddTooltip = this.translate.instant('Add Target');
  routeEdit: string[] = ['sharing', 'iscsi', 'target', 'edit'];

  columns = [
    {
      name: this.translate.instant('Target Name') as string,
      prop: 'name',
      always_display: true,
    },
    {
      name: this.translate.instant('Target Alias') as string,
      prop: 'alias',
    },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Target'),
      key_props: ['name'],
    },
  };

  protected entityList: EntityTableComponent;
  constructor(
    private iscsiService: IscsiService,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (this.fcEnabled) {
      this.columns.push({
        name: this.translate.instant('Mode'),
        prop: 'mode',
      });
    }
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  doAdd(rowId: string = null): void {
    this.modalService.openInSlideIn(TargetFormComponent, rowId);
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
      label: this.translate.instant('Edit'),
      onClick: (rowinner: IscsiTarget) => { this.entityList.doEdit(rowinner.id); },
    }, {
      id: row.name,
      icon: 'delete',
      name: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: IscsiTarget) => {
        let deleteMsg = this.entityList.getDeleteMessage(rowinner);
        this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
          (res) => {
            const payload: [id: number, force?: boolean] = [rowinner.id];
            let warningMsg = '';
            for (const session of res) {
              if (session.target.split(':')[1] == rowinner.name) {
                warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
                payload.push(true); // enable force delele
                break;
              }
            }
            deleteMsg = warningMsg + deleteMsg;

            this.entityList.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: deleteMsg,
              buttonMsg: this.translate.instant('Delete'),
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.entityList.loader.open();
              this.entityList.loaderOpen = true;
              this.entityList.ws.call(this.wsDelete, payload).pipe(untilDestroyed(this)).subscribe(
                () => { this.entityList.getData(); },
                (resinner: WebsocketError) => {
                  new EntityUtils().handleWsError(this, resinner, this.entityList.dialogService);
                  this.entityList.loader.close();
                },
              );
            });
          },
        );
      },
    }];
  }
}
