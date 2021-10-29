import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-extent-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class ExtentListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Extents');
  protected entityTable: EntityTableComponent;
  queryCall = 'iscsi.extent.query' as const;
  route_add: string[] = ['sharing', 'iscsi', 'extent', 'add'];
  route_add_tooltip = this.translate.instant('Add Extent');
  route_edit: string[] = ['sharing', 'iscsi', 'extent', 'edit'];
  wsDelete = 'iscsi.extent.delete' as const;

  columns = [
    {
      name: this.translate.instant('Extent Name'),
      prop: 'name',
      always_display: true,
    },
    {
      name: this.translate.instant('Description'),
      prop: 'comment',
    },
    {
      name: this.translate.instant('Serial'),
      prop: 'serial',
    },
    {
      name: this.translate.instant('NAA'),
      prop: 'naa',
    },
    {
      name: this.translate.instant('Enabled'),
      prop: 'enabled',
    },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Extent'),
      key_props: ['name'],
    },
  };

  constructor(
    protected router: Router,
    protected translate: TranslateService,
  ) {}

  getActions(): EntityTableAction[] {
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (rowinner: IscsiExtent) => { this.entityTable.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: IscsiExtent) => { this.doDelete(rowinner); },
    }] as EntityTableAction[];
  }

  doDelete(row: IscsiExtent): void {
    const id = row.id;
    const entityTable = this.entityTable;
    const isFile = row.type === IscsiExtentType.File;
    const deleteMsg = entityTable.getDeleteMessage(row);
    const conf: DialogFormConfiguration = {
      title: this.translate.instant('Delete iSCSI extent {name}?', { name: row.name }),
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'delete_msg',
          paraText: deleteMsg,
        },
        {
          type: 'checkbox',
          name: 'remove',
          placeholder: this.translate.instant('Remove file?'),
          isHidden: !isFile,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: this.translate.instant('Force'),
          value: false,
        },
      ],
      saveButtonText: this.translate.instant('Delete'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        const value = entityDialog.formValue;
        entityTable.loader.open();
        entityTable.loaderOpen = true;
        entityTable.ws.call(this.wsDelete, [id, value.remove, value.force]).pipe(untilDestroyed(this)).subscribe(
          () => {
            entityDialog.dialogRef.close(true);
            entityTable.getData();
            entityTable.excuteDeletion = true;
          },
          (err: WebsocketError) => {
            entityTable.loader.close();
            new EntityUtils().handleWSError(entityTable, err, entityTable.dialogService);
          },
        );
      },
    };
    this.entityTable.dialogService.dialogForm(conf);
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityTable = entityList;
  }
}
