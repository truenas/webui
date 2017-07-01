import {Component} from '@angular/core';

@Component({
  selector : 'app-user-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class UserListComponent {

  protected resource_name: string = 'account/users';
  protected route_add: string[] = [ 'users', 'add' ];
  protected route_edit: string[] = [ 'users', 'edit' ];
  protected route_delete: string[] = [ 'users', 'delete' ];

  public columns: Array<any> = [
    {name : 'Username', prop : 'bsdusr_username'},
    {name : 'UID', prop : 'bsdusr_uid'},
    {name : 'GID', prop : 'bsdusr_group'},
    {name : 'Home directory', prop : 'bsdusr_home'},
    {name : 'Shell', prop : 'bsdusr_shell'},
    {name : 'Builtin', prop : 'bsdusr_builtin'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdusr_builtin === true) {
      return false;
    }
    return true;
  }
}
