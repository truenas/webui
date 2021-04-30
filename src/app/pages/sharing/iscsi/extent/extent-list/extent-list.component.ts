import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { DialogFormConfiguration } from '../../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityUtils } from '../../../../common/entity/utils';

import { T } from 'app/translate-marker';

@Component({
  selector: 'app-iscsi-extent-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class ExtentListComponent {
  tableTitle = 'Extents';
  protected entityTable: any;
  protected queryCall = 'iscsi.extent.query';
  protected route_add: string[] = ['sharing', 'iscsi', 'extent', 'add'];
  protected route_add_tooltip = 'Add Extent';
  protected route_edit: string[] = ['sharing', 'iscsi', 'extent', 'edit'];
  protected wsDelete = 'iscsi.extent.delete';

  columns: any[] = [
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
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Extent',
      key_props: ['name'],
    },
  };

  getActions() {
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: T('Edit'),
      onClick: (rowinner: any) => { this.entityTable.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: T('Delete'),
      onClick: (rowinner: any) => { this.doDelete(rowinner); },
    }];
  }

  doDelete(row: any) {
    const id = row.id;
    const self = this;
    const entityTable = this.entityTable;
    const isFile = row.type === 'FILE';
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
      customSubmit(entityDialog: EntityDialogComponent) {
        const value = entityDialog.formValue;
        entityTable.loader.open();
        entityTable.loaderOpen = true;
        entityTable.ws.call(self.wsDelete, [id, value.remove, value.force]).subscribe(
          () => {
            entityDialog.dialogRef.close(true);
            entityTable.getData();
            entityTable.excuteDeletion = true;
          },
          (err: any) => {
            entityTable.loader.close();
            new EntityUtils().handleWSError(entityTable, err, entityTable.dialogService);
          },
        );
      },
    };
    this.entityTable.dialogService.dialogForm(conf);
  }

  constructor(protected router: Router) {}

  afterInit(entityList: any) {
    this.entityTable = entityList;
  }
}
