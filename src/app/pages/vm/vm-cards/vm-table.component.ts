import {Component, ElementRef, OnInit, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';

import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'vm-table',
  //templateURL: 'vm-table.component.html' // Why does this throw a missing template error?
  template : `
  <md-card>
  <md-card-content>
    <ngx-datatable
      class='material'
      [rows]='data'
      [columnMode]="'flex'"
      [rowHeight]="'auto'">

      <ngx-datatable-column name="State" [flexGrow]="1">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <md-icon color="primary">power_settings_new</md-icon>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Name" [flexGrow]="3" [minWidth]="200">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div><strong>{{value}}</strong></div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Description" [flexGrow]="3">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div>{{value}}</div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Info" [flexGrow]="3">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div>{{value}}</div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="vCPUs" [flexGrow]="1">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div>{{value}}</div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Memory" [flexGrow]="2">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div>{{value}}</div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Bootloader" [flexGrow]="2">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div>{{value}}</div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Actions" [flexGrow]="3">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	 <div>Actions go in here!</div>
	</ng-template>
      </ngx-datatable-column>

    </ngx-datatable>
  </md-card-content>
  </md-card>
  `
})
export class VmTableComponent {

  protected resource_name: string = 'vm/vm';
  protected route_add: string[] = [ 'vm', 'add' ];
  protected route_add_tooltip: string = "Add VM";
  protected route_edit: string[] = [ 'vm', 'edit' ];
  protected runnningState: string = "RUNNING";
  protected toggleProp: string = "state";
  protected toggleStart: string = "vm.start";
  protected toggleStop: string = "vm.stop";

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService) {}
  public title = "Virtual Machines"

  public columns: Array<any> = [
    {name : 'State', prop : 'state'},
    {name : 'Name', prop : 'name'} ,
    {name : 'Description', prop : 'description'},
    {name : 'Info', prop : 'info' },
    {name : 'vCPUs', prop : 'vcpus'},
    {name : 'Memory', prop : 'memory'},
    {name : 'Bootloader', prop : 'bootloader'},
    {name: 'Autostart', prop : 'autostart'},
    {name: 'Actions', prop : 'cardActions'},
  ];

  @Input() data: any[];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    rows: this.data,
  };

  afterInit() { 
    this.config.rows = this.data;
    this.config.columns = this.columns;
  }
  /*
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
  */
}
