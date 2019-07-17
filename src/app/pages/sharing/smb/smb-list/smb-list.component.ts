import { Component } from '@angular/core';
import { delete_share_message, helptext_sharing_smb } from 'app/helptext/sharing';
import { T } from 'app/translate-marker';
 
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
    title: T('Unshare'),
    button: T('Unshare'),
    buildMessage: share => delete_share_message(share.cifs_name)
  }
}
