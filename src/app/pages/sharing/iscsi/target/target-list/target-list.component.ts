import { Component } from '@angular/core';

import { T } from 'app/translate-marker';

@Component({
  selector : 'app-iscsi-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class TargetListComponent {

  protected queryCall = 'iscsi.target.query';
  protected wsDelete = 'iscsi.target.delete';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'target', 'add' ];
  protected route_add_tooltip = "Add Target";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'target', 'edit' ];

  public columns: Array<any> = [
    {
      name : T('Target Name'),
      prop : 'name',
    },
    {
      name : T('Target Alias'),
      prop : 'alias',
    },
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Target',
      key_props: ['name']
    },
  };

  constructor() {}

}
