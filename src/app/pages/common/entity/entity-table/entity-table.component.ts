import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
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
import { ErdService } from 'app/services/erd.service';


@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  providers: [DialogService]
})
export class EntityTableComponent implements OnInit, AfterViewInit {

  @Input() title = '';
  @Input('conf') conf: any;
  
  @ViewChild('filter') filter: ElementRef;
 
  // MdPaginator Inputs
  public paginationPageSize = 20;
  public paginationPageSizeOptions = [5, 10, 20, 100, 1000];
  public paginationPageIndex = 0;
  public paginationPageEvent: any;
  public hideTopActions = false;
  
  public displayedColumns: string[] = [];
  public busy: Subscription;
  public columns: Array<any> = [];
  public rows: any[] = [];
  public currentRows: any[] = []; // Rows applying filter
  public seenRows: any[] = [];
  public getFunction;
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };
  protected loaderOpen: boolean = false;
  public selected = [];

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService, protected erdService: ErdService) { }

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
    if (this.conf.changeEvent) {
      this.conf.changeEvent(this);
    }

    if( typeof(this.conf.hideTopActions) !== 'undefined'  ) {
      this.hideTopActions = this.conf.hideTopActions;
    }

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
        this.paginationPageIndex  = 0;
        this.setPaginationInfo();
      });
  }
  

  ngAfterViewInit(): void {

    this.erdService.attachResizeEventToElement("entity-table-component");
    
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
      if (this.conf.queryCallOption) {
        this.getFunction = this.ws.call(this.conf.queryCall, this.conf.queryCallOption);
      } else {
        this.getFunction = this.ws.call(this.conf.queryCall, []);
      }
    } else {
      this.getFunction = this.rest.get(this.conf.resource_name, options);
    }
    this.busy =
      this.getFunction.subscribe((res)=>{
        this.handleData(res);
      });
  }

  handleData(res): any {

    if( typeof(res) === "undefined" || typeof(res.data) === "undefined" ) {
      res = {
        data: res
      };
    }
    if (res.data) {
      if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
        res.data = this.conf.resourceTransformIncomingRestData(res.data);
      }
    } else {
      if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
        res = this.conf.resourceTransformIncomingRestData(res);
      }
    }

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

    if (this.conf.queryRes) {
      this.conf.queryRes = rows;
    }

    for (let i = 0; i < rows.length; i++) {
      for (let attr in rows[i]) {
        if (rows[i].hasOwnProperty(attr)) {
          rows[i][attr] = this.rowValue(rows[i], attr);
        }
      }
    }

    this.rows = rows;

    if (this.conf.dataHandler) {
      this.conf.dataHandler(this);
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }
    
    this.currentRows = this.rows;
    this.paginationPageIndex  = 0;
    this.setPaginationInfo();
    return res;

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


  setPaginationPageSizeOptions(setPaginationPageSizeOptionsInput: string) {
    this.paginationPageSizeOptions = setPaginationPageSizeOptionsInput.split(',').map(str => +str);
  }

 
  paginationUpdate($pageEvent: any) {
    
    this.paginationPageEvent = $pageEvent;    
    this.paginationPageIndex = (typeof(this.paginationPageEvent.offset) !== "undefined" ) 
    ? this.paginationPageEvent.offset : this.paginationPageEvent.pageIndex;
    this.paginationPageSize = this.paginationPageEvent.pageSize;
    this.setPaginationInfo();
  }

  protected setPaginationInfo() {
    
    const beginIndex = this.paginationPageIndex * this.paginationPageSize;
    const endIndex = beginIndex + this.paginationPageSize ;

    if( beginIndex < this.currentRows.length && endIndex > this.currentRows.length ) {
      this.seenRows = this.currentRows.slice(beginIndex, this.currentRows.length);
    } else if( endIndex < this.currentRows.length ) {
      this.seenRows = this.currentRows.slice(beginIndex, endIndex);
    } else {
      this.seenRows = this.currentRows;
    }

  }

  reorderEvent($event) {
    this.paginationPageIndex = 0;
  }

  /**
   * some structure... should be the same as the other rows.
   * which are field maps.  
   * 
   * this method can be called to externally push rows on to the tables.
   * 
   * @param param0 
   */
  pushNewRow(row:any) {
    this.rows.push(row);
    this.currentRows = this.rows;
    this.setPaginationInfo();
  }

  doMultiDelete(selected) {
    this.dialog.confirm("Delete", "Are you sure you want to delete selected itme(s)?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        const data = {};
        if (this.conf.wsMultiDelete) {
          // ws to do multi-delete
          if (this.conf.wsMultiDeleteParams) {
            this.busy = this.ws.job(this.conf.wsMultiDelete, this.conf.wsMultiDeleteParams(selected)).subscribe(
              (res1) => {
                  this.getData();
                  this.selected = [];
               },
              (res1) => {
                new EntityUtils().handleError(this, res1);
                this.loader.close();
              }
            );
          }
        } else {
          // rest to do multi-delete
        }
      }
    })
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);

    if (this.conf.updateMultiAction) {
      this.conf.updateMultiAction(this.selected);
    }
  }
}
