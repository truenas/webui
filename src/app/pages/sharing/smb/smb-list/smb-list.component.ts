import { Component } from '@angular/core';
import { delete_share_message, helptext_sharing_smb } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
 
@Component({
  selector : 'app-smb-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SMBListComponent {

  public title = "Samba";
  protected resource_name: string = 'sharing/cifs/';
  protected wsDelete = 'sharing.smb.delete';
  protected route_add: string[] = [ 'sharing', 'smb', 'add' ];
  protected route_add_tooltip: string = "Add Windows (SMB) Share";
  protected route_edit: string[] = [ 'sharing', 'smb', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'smb', 'delete' ];
  protected entityList: EntityTableComponent;

  public columns: any[] = [
    {name: helptext_sharing_smb.column_name, prop: 'cifs_name'},
    {name: helptext_sharing_smb.column_path, prop: 'cifs_path'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Windows (SMB) Share',
      key_props: ['cifs_name']
    },
  };
  public confirmDeleteDialog = {
    message: delete_share_message + ' '
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }
}
