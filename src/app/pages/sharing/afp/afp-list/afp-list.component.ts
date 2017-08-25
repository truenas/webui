import {Component} from '@angular/core';
import {Router} from '@angular/router';

//import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-afp-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class AFPListComponent {

  protected resource_name: string = 'sharing/afp/';
  protected route_add: string[] = [ 'sharing', 'afp', 'add' ];
  protected route_add_tooltip: string = "Add Apple (AFP) Share";
  protected route_edit: string[] = [ 'sharing', 'afp', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'afp', 'delete' ];

  //constructor(_rest: RestService, _router: Router,) {}

  public columns: any[] = [
    {name : 'Name', prop : 'afp_name'},
    {name : 'Path', prop : 'afp_path'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
}
