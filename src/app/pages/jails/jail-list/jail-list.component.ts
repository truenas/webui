import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jail-list',
  template: `
  <entity-list [conf]="this"></entity-list>
  `
})
export class JailListComponent {

  protected resource_name: string = 'jails/jails';
  protected route_add: string[] = ['jails', 'add'];

  private busy: Subscription;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  public columns:Array<any> = [
    {title: 'Jail', name: 'jail_host'},
    {title: 'IPv4 Address', name: 'jail_ipv4'},
    {title: 'Autostart', name: 'jail_autostart'},
    {title: 'Status', name: 'jail_status'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  getActions(row) {
    let actions = [];
    actions.push({
        id: "edit",
        label: "Edit",
        onClick: (row) => {
          this.router.navigate(new Array('/pages').concat(["jails", "edit", row.id]));
        }
    });
    actions.push({
        label: "Add Storage",
        onClick: (row) => {
        }
    });
    actions.push({
        label: "Stop",
        onClick: (row) => {
        },
    });
    actions.push({
        label: "Restart",
        onClick: (row) => {
        }
    });
    actions.push({
        label: "Shell",
        onClick: (row) => {
        }
    });
    actions.push({
        label: "Delete",
        onClick: (row) => {
        }
    });
    return actions;
  }
}
