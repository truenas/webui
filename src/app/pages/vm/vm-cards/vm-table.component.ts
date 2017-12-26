import {Component, OnChanges, ElementRef, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {RestService, WebSocketService} from '../../../services/';
import { MaterialModule, MdButtonToggleGroup } from '@angular/material';

export class Page {
    //The number of elements in the page
    size: number = 0;
    //The total number of elements
    totalElements: number = 0;
    //The total number of pages
    totalPages: number = 0;
    //The current page number
    pageNumber: number = 0;
}

export class PagedData<T> {
    data = new Array<T>();
    page = new Page();
}

@Component({
  selector : 'vm-table',
  //templateURL: 'vm-table.component.html' // Why does this throw a missing template error?
  template : `
    <ngx-datatable #datatable
      class='material'
      [style.height.px]="tableHeight"
      [rows]='data'
      [columnMode]="'force'"
      [rowHeight]="50"
      [headerHeight]="50"
      [footerHeight]="50"
      [scrollbarV]="true">
      <!--
      [offset]="0"
      [loadingIndicator]="true"
      [externalPaging]="true"
      [count]="page.totalElements"
      [offset]="page.pageNumber"
      (page)='setPage($event)'> -->

      <ngx-datatable-column name="State">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-row="row" let-value="value" ngx-datatable-cell-template>
	  <button md-icon-button (click)="onPower(row)" style="position:absolute;bottom:6px;"><md-icon [style.color]="value == 'running' ? '#41bd45' : '#900'">power_settings_new</md-icon></button>
	  <!--<span> {{value}} </span>-->
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Name" [minWidth]="100">
	<ng-template let-column="column" ngx-datatable-header-template>
	  {{column.name}}
	</ng-template>
	<ng-template let-value="value" ngx-datatable-cell-template>
	  <div><strong>{{value}}</strong></div>
	</ng-template>
      </ngx-datatable-column>

      <ngx-datatable-column name="Description">
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
  
      <ngx-datatable-column name="Actions" [flexGrow]="2">
        <ng-template let-column="column" ngx-datatable-header-template>
          {{column.name}}
        </ng-template>
        <ng-template let-row="row" let-value="value" ngx-datatable-cell-template>
	 <button md-icon-button [mdMenuTriggerFor]="menu" style="position:absolute;bottom:6px;">
	  <md-icon>more_vert</md-icon>
	 </button>
	 <md-menu #menu="mdMenu">
	    <button md-menu-item (click)="editRow(row)">Edit</button>
	    <button md-menu-item (click)="deleteRow(row)">Delete</button>
	  </md-menu>
        </ng-template>
      </ngx-datatable-column>

    </ngx-datatable>
  `
})
export class VmTableComponent implements OnChanges{

  protected resource_name: string = 'vm/vm';
  protected route_add: string[] = [ 'vm', 'add' ];
  protected route_add_tooltip: string = "Add VM";
  protected route_edit: string[] = [ 'vm', 'edit' ];
  protected runnningState: string = "RUNNING";
  protected toggleProp: string = "state";
  protected toggleStart: string = "vm.start";
  protected toggleStop: string = "vm.stop";

	
  public title = "Virtual Machines"

  public columns: Array<any> = [
    {name : 'State', prop : 'state'},
    {name : 'Name', prop : 'name'} ,
    {name : 'Description', prop : 'description'},
    //{name : 'Info', prop : 'info' },
    {name : 'vCPUs', prop : 'vcpus'},
    {name : 'Memory', prop : 'memory'},
    {name : 'Bootloader', prop : 'bootloader'},
    {name: 'Autostart', prop : 'autostart'},
    {name: 'Actions', prop : 'cardActions'}
  ];

  /*
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    rows: this.data,
  };
   */

  @Input() data: any[];
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();
  @Output() power: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('datatable') datatable;
  public page = new Page();

  public rows = new Array<any>();
  public cache: any = {};
  public pageSize:number = 8;
  public tableHeight:number;
  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {
    this.page.pageNumber = 0;
  }

  ngOnChanges() {
    console.log("******** VM-CARDS ********");
    this.datatable.limit = this.pageSize; // items per page
    this.datatable.pageSize = 8;//this.pageSize;
    this.datatable.recalculate();
    console.log(this.datatable);
    this.setTableHeight(this.datatable);
  }

  setTableHeight(t){
    console.log("Row: " + t.rowHeight);
    console.log("Header: " + t.headerHeight);
    console.log("Footer: " + t.footerHeight);
    let height = (50*this.pageSize) + 100;
    console.log("******** New tableHeight = " + height);
    //return String(height) + "px";
    this.tableHeight = height;
  }

  setPage(pageInfo){
    console.log("********  setPage ********");
    console.log(pageInfo);
    this.page.pageNumber = pageInfo.offset;
    this.page.size = pageInfo.pageSize;    

    this.getResults(this.page).subscribe(pagedData => {
    this.page = pagedData.page;

      // calc start
      const start = this.page.pageNumber * this.page.size;
  
      // copy rows
      const rows = [...this.data];
  
      // insert rows into new position
      rows.splice(start, 0, ...pagedData.data);
  
      // set rows to our new rows
      this.rows = rows;
  
      // add flag for results
        this.cache[this.page.pageNumber] = true;
    });
  }

   /**
  * A method that mocks a paged server response
  * @param page The selected page
  * @returns {any} An observable containing the employee data
  */
  public getResults(page: Page): Observable<PagedData<any>> {
      return Observable.of(this.data).map(data => this.getPagedData(page));
  }

  private getPagedData(page: Page): PagedData<any> {
    let pagedData = new PagedData<any>();
    page.totalElements = this.data.length;
    page.totalPages = page.totalElements / page.size;
    let start = page.pageNumber * page.size;
    let end = Math.min((start + page.size), page.totalElements);
    for (let i = start; i < end; i++){
    /*
      let jsonObj = data[i];
      let employee = new CorporateEmployee(jsonObj.name, jsonObj.gender, jsonObj.company, jsonObj.age);
    */
      pagedData.data.push(this.data[i]);
    }
    pagedData.page = page;
    return pagedData;
  }

  editRow(row){
    let index = this.data.indexOf(row);
    console.log(index);
    this.edit.emit(index);
  }

  deleteRow(row){
    let index = this.data.indexOf(row);
    console.log(index);
    this.delete.emit(index);
  }

  onPower(row){
    let index = this.data.indexOf(row);
    console.log(index);
    this.power.emit(index);
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
