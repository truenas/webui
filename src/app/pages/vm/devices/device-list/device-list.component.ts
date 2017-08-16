import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'app-device-list',
  template : `
  <h1> VM: {{ this.vm }} Devices </h1>
  <entity-table [conf]="this"></entity-table>
  `
})
export class DeviceListComponent {

  protected resource_name: string;
  protected route_edit: string[];
  protected route_delete: string[];
  protected pk: any;
  public vm: string;
  public sub: Subscription;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  public columns: Array<any> = [
    {name : 'Type', prop : 'dtype'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  isActionVisible(actionId: string, row: any) {
    return actionId == 'delete' && row.id === true ? false : true;
  }

  getAddActions() {
    let actions = [];
    actions.push({
      label : "Add CDROM",
      onClick : () => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "cdrom", "add" ]));
      }
    });
    actions.push({
      label : "Add NIC",
      onClick : () => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "nic", "add" ]));
      }
    });
    actions.push({
      label : "Add Disk",
      onClick : () => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "disk", "add" ]));
      }
    });
    actions.push({
      label : "Add VNC",
      onClick : () => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "vnc", "add" ]));
      }
    });
    actions.push({
      label : "Add RawFile",
      onClick : () => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "rawfile", "add" ]));
      }
    });
    return actions;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label : "Edit",
      onClick : (row) => {
        // console.log(row);
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "edit", row.id, row.dtype ]));
      }
    });
    actions.push({
      label : "Delete",
      onClick : (row) => {
        this.router.navigate(new Array('/pages').concat(
            [ "vm", this.pk, "devices", this.vm, "delete", row.id ]));
      },
    });
    return actions;
  }
  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_edit = [ 'vm', this.pk, 'devices', this.vm, 'edit' ];
      this.route_delete = [ 'vm', this.pk, 'devices', this.vm, 'delete' ];
      // this is filter by vm's id to show devices belonging to that VM
      this.resource_name = 'vm/device/?vm__id=' + this.pk;
    });
  }
}
