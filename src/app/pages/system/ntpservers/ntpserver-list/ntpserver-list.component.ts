import {Component} from '@angular/core';
import { T } from '../../../../translate-marker';
import {Router} from '@angular/router';


@Component({
  selector : 'app-ntpserver-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class NTPServerListComponent {

  public title = "NTP Servers";
  protected resource_name: string = 'system/ntpserver';
  protected route_add: string[] = [ 'system', 'ntpservers', 'add' ];
  protected route_add_tooltip = "Add NTP Server";
  protected route_edit: string[] = [ 'system', 'ntpservers', 'edit' ];
  protected route_delete: string[] = [ 'system', 'ntpservers', 'delete' ];
  protected route_success: string[] = [ 'system', 'ntpservers' ];
  
  public columns: Array<any> = [
    {name : 'Address', prop : 'ntp_address', always_display: true},
    {name : 'Burst', prop : 'ntp_burst'},
    {name : 'IBurst', prop : 'ntp_iburst'},
    {name : 'Prefer', prop : 'ntp_prefer'},
    {name : 'Min. Poll', prop : 'ntp_minpoll'},
    {name : 'Max. Poll', prop : 'ntp_maxpoll'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    multiSelect: true
  };

  constructor(private router: Router) {};

  public singleActions: Array < any > = [
    {
      label : T("Edit"),
      id: "edit",
      enable: true,
      onClick : (server) => {
        // But this was being done already, without the router here, or actions...?
        this.router.navigate(new Array('/').concat(
          [ "system", "ntpservers", "edit", server[0].id ]));
      }

    }, 
    {
      label : T("Delete"),
      id: "delete",
      enable: true,
      onClick : (server) => {
        console.log(server);
        // this.entityList.doDelete(users_edit[0].id );
      }
    }
  ];
}
