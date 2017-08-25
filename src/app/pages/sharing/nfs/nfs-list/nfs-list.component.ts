import { Component } from '@angular/core';

@Component({
  selector : 'app-nfs-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class NFSListComponent {

  protected resource_name: string = 'sharing/nfs/';
  protected route_add: string[] = [ 'sharing', 'nfs', 'add' ];
  protected route_add_tooltip: string = "Add Unix (NFS) Share";
  protected route_edit: string[] = [ 'sharing', 'nfs', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'nfs', 'delete' ];

  public columns: any[] = [
    {name: 'Path', prop: 'nfs_paths'},
    {name: 'Comment', prop: 'nfs_comment'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}