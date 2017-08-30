import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-iscsi-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class TargetListComponent {

  protected resource_name: string = 'services/iscsi/target';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'target', 'add' ];
  protected route_add_tooltip: string = "Add Target";
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'target', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'target', 'edit' ];

  constructor(protected router: Router) {}

  public columns: Array<any> = [
    {
      name : 'Target Name',
      prop : 'iscsi_target_name',
    },
    {
      name : 'Target Alias',
      prop : 'iscsi_target_alias',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}
}
