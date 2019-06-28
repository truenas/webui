
import {of as observableOf, interval as observableInterval, Observable,  Subject } from 'rxjs';

import {map} from 'rxjs/operators';
import {Component, OnChanges, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {RestService, WebSocketService} from '../../../services/';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

export class Page {
    //The number of elements in the page
    size = 0;
    //The total number of elements
    totalElements = 0;
    //The total number of pages
    totalPages = 0;
    //The current page number
    pageNumber = 0;
}

export class PagedData<T> {
    data = new Array<T>();
    page = new Page();
}

@Component({
  selector : 'app-vm-table',
  templateUrl: './vm-table.component.html' // Why does this throw a missing template error?
})
export class VmTableComponent implements OnChanges{

  protected resource_name = 'vm/vm';
  protected route_add = [ 'vm', 'add' ];
  protected route_add_tooltip = "Add VM";
  protected route_edit = [ 'vm', 'edit' ];
  protected runnningState = "RUNNING";
  protected toggleProp = "state";
  protected toggleStart = "vm.start";
  protected toggleStop = "vm.stop";


  public title = "Virtual Machines"

  public columns: Array<any> = [
    {name : 'State', prop : 'state'},
    {name : 'Name', prop : 'name'} ,
    {name : 'Description', prop : 'description'},
    {name : 'vCPUs', prop : 'vcpus'},
    {name : 'Memory', prop : 'memory'},
    {name : 'Bootloader', prop : 'bootloader'},
    {name: 'Autostart', prop : 'autostart'},
    {name: 'Actions', prop : 'cardActions'}
  ];

  @Input() data: any[];
  @Input() target: Subject<any>;
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();
  @Output() power: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('datatable', { static: true}) datatable;
  public page = new Page();

  public rows = new Array<any>();
  public cache: any = {};
  public pageSize = 8;
  public tableHeight:number;
  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, private core:CoreService) {
    this.page.pageNumber = 0;
  }

  ngOnChanges(changes) {
    /* TODO: remove this after middleware part is ready to give back
    correct state.
    */
   observableInterval(5000).subscribe((val) => {
    this.checkStatus();
   });
    if(changes.data){
      const newData = Object.assign(this.data,{});
      this.data = newData;
    }
    this.datatable.limit = this.pageSize; // items per page
    this.datatable.pageSize = 8;
    this.datatable.recalculate();
    this.setTableHeight(this.datatable);
  }

  setTableHeight(t){
    const height = (50*this.pageSize) + 100;
    this.tableHeight = height;
  }

  setPage(pageInfo){
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
      return observableOf(this.data).pipe(map(data => this.getPagedData(page)));
  }

  private getPagedData(page: Page): PagedData<any> {
    const pagedData = new PagedData<any>();
    page.totalElements = this.data.length;
    page.totalPages = page.totalElements / page.size;
    const start = page.pageNumber * page.size;
    const end = Math.min((start + page.size), page.totalElements);
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
    const index = this.data.indexOf(row);
    this.edit.emit(index);
  }

  goToDevices(row){
    this.router.navigate(
      new Array('').concat([ "vm", row.id, "devices", row.name ])
    );
  }

  deleteRow(row){
    const index = this.data.indexOf(row);
    this.delete.emit(index);
  }

  onPower(row, power?){
    const index = this.data.indexOf(row);
    if (power) {
      this.power.emit({index:index, force:power});
    } else {
      this.power.emit(index);
    };
    
  }

  onRestart(row){
    const index = this.data.indexOf(row);
    const machine = Object.assign({}, row);
    machine.machineId = row.id;
    this.target.next({name:"RestartVM", data:index, sender:machine})
  }
  checkStatus(id?:number){ 
    this.core.emit({
      name:"VmStatusRequest",
      data:[]
    });
  }

  vnc(index){
    this.ws.call('vm.get_vnc_web', [ index ]).subscribe((res) => {
      for (const item in res){
        window.open(res[item]);
      }
    });
  }

  serial(index){
    this.router.navigate(
      new Array('').concat([ "vm","serial", index])
    );
  }

}
