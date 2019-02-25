import { Component } from '@angular/core';
import { Router } from '@angular/router';

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
  protected wsDelete = "iscsi.extent.delete";

  public columns: Array<any> = [
    {
      name : 'Extent Name',
      prop : 'name',
    },
    {
      name : 'Serial',
      prop : 'serial',
    },
    {
      name: 'NAA',
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
