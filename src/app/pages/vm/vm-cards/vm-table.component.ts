import {Component, OnChanges, ElementRef, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {RestService, WebSocketService} from '../../../services/';
import { MaterialModule } from '../../../appMaterial.module';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';

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
  templateUrl: './vm-table.component.html' // Why does this throw a missing template error?
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

  ngOnChanges(changes) {
    if(changes.data){
      console.log("VM Table: DATA CHANGED!");
      let newData = Object.assign(this.data,{});
      this.data = newData;
    }
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

  goToDevices(row){
    let index = this.data.indexOf(row);
    this.router.navigate(
      new Array('').concat([ "vm", row.id, "devices", row.name ])
    );
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

}
