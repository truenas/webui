import { Component } from '@angular/core';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-nfs-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class NFSListComponent {

  public title = "NFS";
  protected resource_name: string = 'sharing/nfs/';
  protected route_add: string[] = [ 'sharing', 'nfs', 'add' ];
  protected route_add_tooltip: string = "Add Unix (NFS) Share";
  protected route_edit: string[] = [ 'sharing', 'nfs', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'nfs', 'delete' ];

  public columns: any[] = [
    {name: T('Path'), prop: 'nfs_paths'},
    {name: T('Comment'), prop: 'nfs_comment'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
