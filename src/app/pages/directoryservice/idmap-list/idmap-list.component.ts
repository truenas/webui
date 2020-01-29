import { Component } from '@angular/core';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-idmap-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class IdmapListComponent {
  public title = "Idmap";
  protected queryCall = 'idmap.query';
  protected route_add: string[] = [ 'idmap', 'add' ];
  protected route_add_tooltip = T("Add Idmap");
  protected route_edit: string[] = [ 'idmap', 'edit' ];
  protected route_delete: string[] = [ 'idmap', 'delete' ];
  protected entityList: any;
  protected loaderOpen = false;

  public columns: Array<any> = [
    {name : 'Name', prop : 'name', always_display: true},
    {name : 'DNS Domain Name', prop : 'dns_domain_name'},
    {name : 'Range Low', prop : 'range_low'},
    {name : 'Range High', prop : 'range_high'},
    {name : 'Backend', prop : 'idmap_backend'},
    {name : 'Certificate', prop : 'certificate_id'},
  ];

  public rowIdentifier = 'name';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: T('Idmap'),
      key_props: ['name']
    },
  };

  constructor() { }

  afterInit(entityList: any) { this.entityList = entityList; }
  

}
