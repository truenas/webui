import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-storage-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class StorageListComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_add: string[] = [ 'jails', 'storage', 'add' ];
  protected route_add_tooltip: string = "Add Storage";
  protected route_delete: string[] = [ 'jails', 'storage', 'delete' ];
  protected route_edit: string[] = [ 'jails', 'storage', 'edit' ];

  constructor(protected router: Router) {}

  public columns: Array<any> = [
    {name : 'Jail', prop : 'jail'},
    {name : 'Source', prop : 'source'},
    {name : 'Destination', prop : 'destination'},
    {name : 'Mounted', prop : 'mounted'},
    {name : 'Read-Only', prop : 'readonly'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
