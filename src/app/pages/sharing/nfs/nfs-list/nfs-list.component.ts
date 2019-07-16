import { Component } from '@angular/core';
import { delete_share_message, helptext_sharing_nfs } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { T } from 'app/translate-marker';

@Component({
  selector : 'app-nfs-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class NFSListComponent {

  public title = "NFS";
  protected resource_name: string = 'sharing/nfs/';
  protected wsDelete = 'sharing.nfs.delete';
  protected route_add: string[] = [ 'sharing', 'nfs', 'add' ];
  protected route_add_tooltip: string = "Add Unix (NFS) Share";
  protected route_edit: string[] = [ 'sharing', 'nfs', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'nfs', 'delete' ];
  protected entityList: EntityTableComponent;

  public columns: any[] = [
    {name: helptext_sharing_nfs.column_path, prop: 'nfs_paths'},
    {name: helptext_sharing_nfs.column_comment, prop: 'nfs_comment'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Unix (NFS) Share',
      key_props: ['nfs_paths']
    },
  };

  public confirmDeleteDialog = {
    title: T('Unshare'),
    message: delete_share_message,
    button: T('Unshare'),
    isMessageComplete: true
  }

  public afterInit(entityList: EntityTableComponent) {
    this.entityList = entityList;
  }
}
