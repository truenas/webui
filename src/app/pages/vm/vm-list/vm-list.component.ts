import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';


import {RestService, WebSocketService} from '../../../services/';
import {EntityTableComponent} from '../../common/entity/entity-table/';

@Component({
  selector : 'app-vm-list',
  templateUrl : './vm-list.component.html'
})
export class VmListComponent {

  protected resource_name: string = 'vm/vm';
  protected route_add: string[] = [ 'vm', 'add' ];
  protected route_add_tooltip: string = "Add VM";
  protected route_edit: string[] = [ 'vm', 'edit' ];
  protected runnningState: string = "RUNNING";
  protected toggleProp: string = "state";
  protected toggleStart: string = "vm.start";
  protected toggleStop: string = "vm.stop";

  protected entityTable: EntityTableComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}
  public title = "Virtual Machines"

  public columns: Array<any> = [
    {name : 'Name', prop : 'name', card: true, always_display: true },
    {name : 'Description', prop : 'description'},
    {name : 'Info', prop : 'info', card: true},
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
    actions.push({
      label : "Web VNC",
      onClick : (row) => {
        let rpc: string;
        this.ws.call('vm.get_vnc_web', [ row.id ]).subscribe((res) => {
          for (let item in res){
            window.open(res[item])
          }
        });
      }
    });
        actions.push({
      label : "wizard",
      onClick : (row) => {
        this.router.navigate(
            new Array('').concat([ "", "wizard" ]));
      }
    });
    return actions;
  }
  getCardActions(row) {
    let actions = [];
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
    actions.push({
      label : "Web VNC",
      onClick : (row) => {
        let rpc: string;
        this.ws.call('vm.get_vnc_web', [ row.id ]).subscribe((res) => {
          for (let item in res){
            window.open(res[item])
          }
        });
      }
    });
    return actions;
  }
  getAddActions() {
    return [{
        label: "Jail Wizard",
        icon: "beach_access",
        onClick: () => {
          this.router.navigate(
            new Array('').concat(["jails", "wizard"]));
        }
      }]
  }
}
