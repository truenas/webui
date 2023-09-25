import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-target-list',
  template: `
    <ix-entity-table [conf]="this" [title]="title"></ix-entity-table>
  `,
  providers: [IscsiService],
})
export class TargetListComponent implements EntityTableConfig<IscsiTarget> {
  title = this.translate.instant('Targets');
  queryCall = 'iscsi.target.query' as const;
  wsDelete = 'iscsi.target.delete' as const;
  routeAdd: string[] = ['sharing', 'iscsi', 'target', 'add'];
  routeAddTooltip = this.translate.instant('Add Target');
  routeEdit: string[] = ['sharing', 'iscsi', 'target', 'edit'];

  columns = [
    {
      name: this.translate.instant('Target Name'),
      prop: 'name',
      always_display: true,
    },
    {
      name: this.translate.instant('Target Alias'),
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

  protected entityList: EntityTableComponent<IscsiTarget>;
  constructor(
    private iscsiService: IscsiService,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent<IscsiTarget>): void {
    this.entityList = entityList;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(TargetFormComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number): void {
    const target = this.entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(TargetFormComponent, { wide: true, data: target });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  getActions(row: IscsiTarget): EntityTableAction<IscsiTarget>[] {
    return [{
      id: row.name,
      icon: 'edit',
      name: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (rowInner: IscsiTarget) => {
        this.entityList.doEdit(rowInner.id);
      },
    }, {
      id: row.name,
      icon: 'delete',
      name: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowInner: IscsiTarget) => {
        this.deleteRow(rowInner);
      },
    }];
  }

  private deleteRow(rowInner: IscsiTarget): void {
    let deleteMsg = this.entityList.getDeleteMessage(rowInner);
    this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
      (sessions) => {
        const payload: [id: number, force?: boolean] = [rowInner.id];
        let warningMsg = '';
        for (const session of sessions) {
          if (session.target.split(':')[1] === rowInner.name) {
            warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
            payload.push(true); // enable force delete
            break;
          }
        }
        deleteMsg = warningMsg + deleteMsg;

        this.entityList.dialogService.confirm({
          title: this.translate.instant('Delete'),
          message: deleteMsg,
          buttonText: this.translate.instant('Delete'),
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.entityList.ws.call(this.wsDelete, payload).pipe(untilDestroyed(this)).subscribe({
            next: () => this.entityList.getData(),
            error: (error: WebsocketError) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              this.entityList.loader.close();
            },
          });
        });
      },
    );
  }
}
