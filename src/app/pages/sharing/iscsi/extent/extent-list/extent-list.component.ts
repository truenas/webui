import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { T } from 'app/translate-marker';

@Component({
  selector : 'app-iscsi-extent-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class ExtentListComponent {

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

  constructor(protected router: Router) {}

  afterInit(entityList: any) {}
}
