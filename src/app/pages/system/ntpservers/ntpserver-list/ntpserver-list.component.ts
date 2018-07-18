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
  protected entityList: any;
  
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

  afterInit(entityList: any) { this.entityList = entityList; }

  public multiActions: Array < any > = [
    // {
    //   id: "mdelete",
    //   label: "Delete",
    //   icon: "delete",
    //   enable: true,
    //   ttpos: "above",
    //   onClick: (selected) => {
    //     this.entityList.doMultiDelete(selected);
    //   }
    // } multidelete not available in the middleware
  ];

  public singleActions: Array < any > = [
    {
      label : T("Edit"),
      id: "edit",
      icon: "edit",
      ttpos: "above",
      enable: true,
      onClick : (selected) => {
        // But this was being done already, without the router here, or actions...?
        this.router.navigate(new Array('/').concat(
          [ "system", "ntpservers", "edit", selected[0].id ]));
      }

    }, 
    {
      label : T("Delete"),
      id: "delete",
      icon: "delete",
      ttpos: "above",
      enable: true,
      onClick : (selected) => {
        this.entityList.doDelete(selected[0].id );
      }
    }
  ];
}
