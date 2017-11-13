import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk';
import { MdPaginator, MdSort, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

//local libs
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services';


@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  providers: [DialogService]
})
export class EntityTableComponent implements OnInit {

  @Input() title = '';
  @Input('conf') conf: any;

  
  @ViewChild('filter') filter: ElementRef;

  // MdPaginator Inputs
  public paginationLength = 0;
  public paginationPageSize = 5;
  public paginationPageSizeOptions = [5, 10, 20];
  public paginationPageIndex = 0;
  public paginationPageEvent: PageEvent;
  
  
  public displayedColumns: string[] = [];
  public busy: Subscription;
  public columns: Array<any> = [];
  public rows: any[] = [];
  public currentRows: any[] = []; // Rows applying filter
  public paginatedSeenRows: any[] = [];  // THe visible rows.
  public getFunction;
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };
  protected loaderOpen: boolean = false;

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, private dialog: DialogService, protected loader: AppLoaderService) { }

  ngOnInit() {
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.getData();
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }

   
    this.conf.columns.forEach((column) => {
      this.displayedColumns.push(column.prop);
    });

    this.displayedColumns.push("action");

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        const filterValue: string = this.filter.nativeElement.value;
        let newData: any[] = [];

        if (filterValue.length > 0) {
          this.rows.forEach((dataElement) => {
            for (const dataElementProp of this.conf.columns) {
              let value: any = dataElement[dataElementProp.prop];
              
              if( typeof(value) === "boolean" || typeof(value) === "number") {
                value = String(value);
              }

              if (typeof (value) === "string" && value.length > 0 && (<string>value).indexOf(filterValue) >= 0) {
                newData.push(dataElement);
                break;
              }
            }

          });
        } else {
          newData = this.rows;
        }

        
        
        this.currentRows = newData;
        this.setPaginationInfo();
      });
  }

  getData() {
    let sort: Array<String> = [];
    let options: Object = new Object();

    for (let i in this.config.sorting.columns) {
      let col = this.config.sorting.columns[i];
      if (col.sort == 'asc') {
        sort.push(col.name);
      } else if (col.sort == 'desc') {
        sort.push('-' + col.name);
      }
    }

    // options = {limit: this.itemsPerPage, offset: offset};
    options = { limit: 0 };
    if (sort.length > 0) {
      options['sort'] = sort.join(',');
    }
    if (this.conf.queryCall) {
      this.getFunction = this.ws.call(this.conf.queryCall, []);
    } else {
      this.getFunction = this.rest.get(this.conf.resource_name, options);
    }
    this.busy =
      this.getFunction.subscribe((res) => {
        let rows: any[] = [];

        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (res.data) {
          rows = new EntityUtils().flattenData(res.data);
        } else {
          rows = new EntityUtils().flattenData(res);
        }
        if (this.conf.dataHandler) {
          this.conf.dataHandler(this);
        }
        for (let i = 0; i < rows.length; i++) {
          for (let attr in rows[i]) {
            if (rows[i].hasOwnProperty(attr)) {
              rows[i][attr] = this.rowValue(rows[i], attr);
            }
          }
        }

        this.rows = rows;
        this.currentRows = rows;
        this.setPaginationInfo();

      });

  }


  trClass(row) {
    let classes = [];
    classes.push('treegrid-' + row.id);
    if (row._parent) {
      classes.push('treegrid-parent-' + row._parent);
    }
    return classes.join(' ');
  }

  getActions(row) {
    if (this.conf.getActions) {
      return this.conf.getActions(row);
    } else {
      return [{
        id: "edit",
        label: "Edit",
        onClick: (row) => { this.doEdit(row.id); },
      }, {
        id: "delete",
        label: "Delete",
        onClick: (row) => { this.doDelete(row.id); },
      },]
    }
  }

  getAddActions() {
    if (this.conf.getAddActions) {
      return this.conf.getAddActions();
    } else {
      return [];
    }
  }

  rowValue(row, attr) {
    if (this.conf.rowValue) {
      try {
        return this.conf.rowValue(row, attr);
      } catch(e) {
        console.log("Conversion issue defaulting to straight value (calling rowValue in conf", this.conf );
        return row[attr];
      }
    }
    return row[attr];
  }

  doAdd() {
    this.router.navigate(new Array('/').concat(this.conf.route_add));
  }

  doEdit(id) {
    this.router.navigate(
      new Array('/').concat(this.conf.route_edit).concat(id));
  }

  doDelete(id) {
    this.dialog.confirm("Delete", "Are you sure you want to delete it?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        if (this.conf.wsDelete) {
          this.busy = this.ws.call(this.conf.wsDelete, [id]).subscribe(
            (res) => { this.getData() },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
          );
        } else {
          this.busy = this.rest.delete(this.conf.resource_name + '/' + id, data).subscribe(
            (res) => {
              this.getData();
            },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
          );
        }
      }
    })
  }
  doActivate(id) {
    this.dialog.confirm("Activate", "Are you sure you want to activate it?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.busy = this.ws.call(this.conf.wsActivate, [id]).subscribe(
          (res) => { this.getData() },
          (res) => {
            new EntityUtils().handleError(this, res);
            this.loader.close();
          }
          );
      }
    })
  }
  toggleKeep(id, status) {
    if (!status){
      this.dialog.confirm("Keep", "Do you want to set keep flag in this boot environment?").subscribe((res) => {
        if (res) {
          this.loader.open();
          this.loaderOpen = true;
          let data = {};
          this.busy = this.ws.call(this.conf.wsKeep, [id, { "keep" : true }]).subscribe(
            (res) => { this.getData() },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
            );
        }
      })
    } else {
      this.dialog.confirm("Unkeep", "Do you want to remove keep flag in this boot environment?").subscribe((res) => {
        if (res) {
          this.loader.open();
          this.loaderOpen = true;
          let data = {};
          this.busy = this.ws.call(this.conf.wsKeep, [id, { "keep" : false }]).subscribe(
            (res) => { this.getData() },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
            );
        }
      })

    }

  }


  setPaginationPageSizeOptions(setPaginationPageSizeOptionsInput: string) {
    this.paginationPageSizeOptions = setPaginationPageSizeOptionsInput.split(',').map(str => +str);
  }

 
  paginationUpdate($pageEvent: PageEvent) {
    this.paginationPageEvent = $pageEvent;
    this.paginationPageIndex = this.paginationPageEvent.pageIndex;
    this.paginationPageSize = this.paginationPageEvent.pageSize;
    this.setPaginationInfo();
  }

  private setPaginationInfo() {
    
    const beginIndex = this.paginationPageIndex * this.paginationPageSize;
    const endIndex = beginIndex + this.paginationPageSize ;

    if( beginIndex < this.currentRows.length && endIndex > this.currentRows.length ) {
      this.paginatedSeenRows = this.currentRows.slice(beginIndex, this.currentRows.length);
    } else if( endIndex < this.currentRows.length ) {
      this.paginatedSeenRows = this.currentRows.slice(beginIndex, endIndex);
    } else {
      this.paginatedSeenRows = this.currentRows;
    }

    this.paginationLength = this.currentRows.length;
  }
}
