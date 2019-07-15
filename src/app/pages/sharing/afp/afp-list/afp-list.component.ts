import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-afp-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class AFPListComponent {

  public title = "AFP (Apple File Protocol)";
  protected resource_name: string = 'sharing/afp/';
  protected route_add: string[] = [ 'sharing', 'afp', 'add' ];
  protected route_add_tooltip: string = "Add Apple (AFP) Share";
  protected route_edit: string[] = [ 'sharing', 'afp', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'afp', 'delete' ];

  //constructor(_rest: RestService, _router: Router,) {}

  public columns: any[] = [
    {name : T('Name'), prop : 'afp_name', always_display: true},
    {name : T('Path'), prop : 'afp_path'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Apple (AFP) Share',
      key_props: ['afp_name']
    },
  };
}
