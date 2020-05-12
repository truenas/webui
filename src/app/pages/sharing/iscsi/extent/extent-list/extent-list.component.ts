import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DialogFormConfiguration } from '../../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityUtils } from '../../../../common/entity/utils';

import { T } from 'app/translate-marker';

@Component({
  selector : 'app-iscsi-extent-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class ExtentListComponent {

  protected entityTable;
  protected queryCall = 'iscsi.extent.query';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'extent', 'add' ];
  protected route_add_tooltip: string = "Add Extent";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'extent', 'edit' ];
  protected wsDelete = 'iscsi.extent.delete';

  public columns: Array<any> = [
    {
      name : T('Extent Name'),
      prop : 'name',
      always_display: true
    },
    {
      name : T('Description'),
      prop : 'comment',
    },
    {
      name : T('Serial'),
      prop : 'serial',
    },
    {
      name: T('NAA'),
      prop: 'naa',
    },
    {
      name: T('Enabled'),
      prop: 'enabled',
    }
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Extent',
      key_props: ['name']
    },
  };

  getActions(row) {
    return [{
      name: 'edit',
      id: "edit",
      icon: 'edit',
      label: T("Edit"),
      onClick: (rowinner) => { this.entityTable.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: "delete",
      icon: 'delete',
      label: T("Delete"),
      onClick: (rowinner) => { this.doDelete(rowinner); },
    },]
  }

  doDelete(row) {
    const id = row.id;
    const self = this;
    const entityTable = this.entityTable;
    const isFile = row.type === 'FILE' ? true : false;
    const deleteMsg = entityTable.getDeleteMessage(row);
    const conf: DialogFormConfiguration = {
      title: T("Delete iSCSI extent ") + row.name + '?',
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
          value: false
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: T('Force'),
          value: false
        }
      ],
      saveButtonText: T("Delete"),
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue;
        entityTable.loader.open();
        entityTable.loaderOpen = true;
        entityTable.ws.call(self.wsDelete, [id, value.remove, value.force]).subscribe(
          (resinner) => {
            entityDialog.dialogRef.close(true);
            entityTable.getData();
            entityTable.excuteDeletion = true;
          },
          (err) => {
            entityTable.loader.close();
            new EntityUtils().handleWSError(entityTable, err, entityTable.dialogService);
          }
        )
      }
    }
    this.entityTable.dialogService.dialogForm(conf);
  }

  constructor(protected router: Router) {}

  afterInit(entityList: any) {
    this.entityTable = entityList;
  }
}
