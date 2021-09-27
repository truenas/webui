import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-extent-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class ExtentListComponent implements EntityTableConfig {
  tableTitle = 'Extents';
  protected entityTable: EntityTableComponent;
  queryCall: 'iscsi.extent.query' = 'iscsi.extent.query';
  route_add: string[] = ['sharing', 'iscsi', 'extent', 'add'];
  route_add_tooltip = 'Add Extent';
  route_edit: string[] = ['sharing', 'iscsi', 'extent', 'edit'];
  wsDelete: 'iscsi.extent.delete' = 'iscsi.extent.delete';

  columns = [
    {
      name: T('Extent Name'),
      prop: 'name',
      always_display: true,
    },
    {
      name: T('Description'),
      prop: 'comment',
    },
    {
      name: T('Serial'),
      prop: 'serial',
    },
    {
      name: T('NAA'),
      prop: 'naa',
    },
    {
      name: T('Enabled'),
      prop: 'enabled',
    },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Extent',
      key_props: ['name'],
    },
  };

  getActions(): EntityTableAction[] {
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: T('Edit'),
      onClick: (rowinner: IscsiExtent) => { this.entityTable.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: T('Delete'),
      onClick: (rowinner: IscsiExtent) => { this.doDelete(rowinner); },
    }] as EntityTableAction[];
  }

  doDelete(row: IscsiExtent): void {
    const id = row.id;
    const entityTable = this.entityTable;
    const isFile = row.type === IscsiExtentType.File;
    const deleteMsg = entityTable.getDeleteMessage(row);
    const conf: DialogFormConfiguration = {
      title: T('Delete iSCSI extent ') + row.name + '?',
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'delete_msg',
          paraText: deleteMsg,
        },
        {
          type: 'checkbox',
          name: 'remove',
          placeholder: T('Remove file?'),
          isHidden: !isFile,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: T('Force'),
          value: false,
        },
      ],
      saveButtonText: T('Delete'),
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

  constructor(protected router: Router) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityTable = entityList;
  }
}
