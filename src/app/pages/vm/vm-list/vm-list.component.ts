import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';


import {RestService, WebSocketService} from '../../../services/';
import {EntityTableComponent} from '../../common/entity/entity-table/';

@Component({
  selector : 'app-vm-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class VmListComponent {

  protected resource_name: string = 'vm/vm';
  protected route_add: string[] = [ 'vm', 'add' ];
  protected route_add_tooltip: string = "Add VM";
  protected route_edit: string[] = [ 'vm', 'edit' ];

  protected entityTable: EntityTableComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'name'},
    {name : 'Description', prop : 'description'},
    {name : 'Info', prop : 'info'},
    {name : 'Virtual CPUs', prop : 'vcpus'},
    {name : 'Memory Size (MiB)', prop : 'memory'},
    {name : 'Boot Loader Type', prop : 'bootloader'},
    {name : 'State', prop : 'state'},
    {name: 'Autostart', prop : 'autostart'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityTable: EntityTableComponent) { this.entityTable = entityTable; }

  getActions(row) {
    let actions = [];
    actions.push({
      id : "start",
      label : row.state == "RUNNING" ? "Stop" : "Start",
      onClick : (row) => {
        let rpc: string;
        if (row.state != 'RUNNING') {
          rpc = 'vm.start';
        } else {
          rpc = 'vm.stop';
        }
        this.ws.call(rpc, [ row.id ]).subscribe((res) => {});
      }
    });
    actions.push({
      label : "Edit",
      onClick : (row) => {
        this.router.navigate(
            new Array('').concat([ "vm", "edit", row.id ]));
      }
    });
    actions.push({
      label : "Delete",
      onClick : (row) => {
        this.entityTable.doDelete(row.id );
      },
    });
    actions.push({
      label : "Devices",
      onClick : (row) => {
        this.router.navigate(
            new Array('').concat([ "vm", row.id, "devices", row.name ]));
      }
    });
    return actions;
  }
}
