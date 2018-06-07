import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

//local libs
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services';
import { ErdService } from '../../../../services/erd.service';
import { Subscription } from 'rxjs/Subscription';



export interface InputTableConf {
  
  columns?:any[];
  hideTopActions?: boolean;
  queryCall?: string;
  queryCallOption?: any;
  resource_name?: string;
  route_edit?: string;
  route_add?: string[];
  queryRes?: any [];
  isActionVisible?: any;
  config?: any;
  confirmDeleteDialog?: Object;
  checkbox_confirm?: any;
  checkbox_confirm_show?: any;
  addRows?(entity: EntityTableComponent);
  changeEvent?(entity: EntityTableComponent);
  preInit?(entity: EntityTableComponent);
  afterInit?(entity: EntityTableComponent);
  dataHandler?(entity: EntityTableComponent);
  resourceTransformIncomingRestData?(data);
  getActions?(row): any [];
  getAddActions?(): any [];
  rowValue?(row, attr): any;
  wsDelete?(resp): any;
  wsMultiDelete?(resp): any;
  wsMultiDeleteParams?(selected): any;
  updateMultiAction?(selected): any; 
}

export interface SortingConfig {
  columns: any[];
}

export interface TableConfig {
  paging: boolean;
  sorting: SortingConfig;
}

@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  providers: [DialogService]
})
export class EntityTableComponent implements OnInit, AfterViewInit {

  @Input() title = '';
  @Input('conf') conf: InputTableConf;
  
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

  public allColumns: Array<any> = []; // Need this for the checkbox headings
  public alwaysDisplayedCols: Array<any> = []; // For cols the user can't turn off
  public userPrefColumns: string; // to set user-preferred cols in local storage
  public presetDisplayedCols: Array<any> = []; // to store only the index of preset cols
  public currentPreferredCols: Array<any> = []; // to store current choice of what cols to view
  public arePresetsStillCurrent: boolean; // stores whether we are using factory presets or user preferred ones
  public anythingClicked: boolean = false; // stores a pristine/touched state for checkboxes

  public rows: any[] = [];
  public currentRows: any[] = []; // Rows applying filter
  public seenRows: any[] = [];
  public getFunction;
  public config: TableConfig = {
    paging: true,
    sorting: { columns: this.columns },
  };
  public showDefaults: boolean = false;

  protected loaderOpen = false;
  public selected = [];

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService, 
    protected erdService: ErdService, protected translate: TranslateService) { }

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
      if (!column.always_display) {
        this.allColumns.push(column); // Make array of optionally-displayed cols
      } else {
        this.alwaysDisplayedCols.push(column); // Make an array of required cols
      }
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

      // Next section sets the checked/displayed columns
      if (this.conf.columns && this.conf.columns.length > 7) {
        this.conf.columns = [];
        this.userPrefColumns = window.localStorage.getItem('myCols');
        
        for (let i = 0; i < this.allColumns.length; i++) {
          if (!this.allColumns[i].hidden) {
            this.presetDisplayedCols.push(i);
          }
        } 
  
        if (!this.userPrefColumns || this.userPrefColumns === '') {
          this.arePresetsStillCurrent = true;
          for (let item of this.allColumns) {
            if (!item.hidden) {
              this.conf.columns.push(item);
            }
          }   
        } else {
          this.arePresetsStillCurrent = false;
          let tempArr = this.userPrefColumns.split(',');
          for (let item of tempArr) {
            this.conf.columns.push(this.allColumns[parseInt(item)]);
          }
        }
        this.currentPreferredCols = this.conf.columns;
      }
        // End of checked/display section ------------
        
      setTimeout(() => { this.setShowDefaults(); }, 1000);
    
  }

  setShowDefaults() {
    this.showDefaults = true;
  }
  
  ngAfterViewInit(): void {

    this.erdService.attachResizeEventToElement("entity-table-component");
    
  }

  getData() {
    const sort: Array<String> = [];
    let options: Object = new Object();

    for (const i in this.config.sorting.columns) {
      const col = this.config.sorting.columns[i];
      if (col.sort === 'asc') {
        sort.push(col.name);
      } else if (col.sort === 'desc') {
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

    if (this.conf.queryRes) {
      this.conf.queryRes = rows;
    }

    for (let i = 0; i < rows.length; i++) {
      for (const attr in rows[i]) {
        if (rows[i].hasOwnProperty(attr)) {
          if (rows[i][attr] === true) {
            rows[i][attr] = 'yes';
          } else if (rows[i][attr] === false) {
            rows[i][attr] = 'no';
          } else {
            rows[i][attr] = this.rowValue(rows[i], attr);  
          }
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
    this.showDefaults = true;
    return res;

  }

  trClass(row) {
    const classes = [];

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
        onClick: (rowinner) => { this.doEdit(rowinner.id); },
      }, {
        id: "delete",
        label: "Delete",
        onClick: (rowinner) => { this.doDelete(rowinner.id); },
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
    let dialog = {};
    if (this.conf.checkbox_confirm && this.conf.checkbox_confirm_show && this.conf.checkbox_confirm_show(id)) {
      this.conf.checkbox_confirm(id);
      return;
    }
    if (this.conf.confirmDeleteDialog) {
      dialog = this.conf.confirmDeleteDialog;
    }
    this.dialogService.confirm(
        dialog.hasOwnProperty("title") ? dialog['title'] : T("Delete"), 
        dialog.hasOwnProperty("message") ? dialog['message'] : T("Are you sure you want to delete the selected item?"), 
        dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : false, 
        dialog.hasOwnProperty("button") ? dialog['button'] : T("Delete")).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        const data = {};
        if (this.conf.wsDelete) {
          this.busy = this.ws.call(this.conf.wsDelete, [id]).subscribe(
            (resinner) => { this.getData() },
            (resinner) => {
              new EntityUtils().handleError(this, resinner);
              this.loader.close();
            }
          );
        } else {
          this.busy = this.rest.delete(this.conf.resource_name + '/' + id, data).subscribe(
            (resinner) => {
              this.getData();
            },
            (resinner) => {
              new EntityUtils().handleError(this, resinner);
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
    this.dialogService.confirm("Delete", "Are you sure you want to delete selected item(s)?").subscribe((res) => {
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

  // Next section operates the checkboxes to show/hide columns 
  toggle(col) {
    const isChecked = this.isChecked(col);
    this.anythingClicked = true;
    this.arePresetsStillCurrent = false;

    if(isChecked) {
      this.conf.columns = this.conf.columns.filter(c => { 
        return c.name !== col.name; 
      });
    } else {
      this.conf.columns = [...this.conf.columns, col];
    }
  }

  isChecked(col:any) {
    return this.conf.columns.find(c => {
      return c.name === col.name;
    }) !=undefined;
  }

  // Toggle between all cols selected and the current stored preference
  checkAll() {
    this.anythingClicked = true;
    this.arePresetsStillCurrent = false;
    if (this.conf.columns.length < this.allColumns.length) {
      this.conf.columns = this.allColumns;
      return this.conf.columns
    } else {
      return this.conf.columns = this.currentPreferredCols;
    }
  }

  // Used by the select all checkbox to determine whether it should be checked
  checkLength() {
    return this.conf.columns.length === this.allColumns.length; 
  }

  // Store the view of currently checked cols as the user's default view
  savePrefs() {
    let myColumns = document.getElementsByClassName('colselect');
    let myPrefs = [];
    for (let i = 0; i < myColumns.length; i++) {
      if (myColumns[i].attributes[4].value === 'true' ) {
        myPrefs.push(i);
      }
    }
    this.currentPreferredCols = this.conf.columns;
    localStorage.setItem('myCols', myPrefs.toString());
    this.anythingClicked = false;
  }

  // Reset the default view to "factory" settings specified when cols are created
  resetPrefs() {
    this.conf.columns = [];
    for (let i = 0; i < this.allColumns.length; i++) {
      if (this.presetDisplayedCols.includes(i)){
        this.conf.columns.push(this.allColumns[i]);
      }
      this.currentPreferredCols = this.conf.columns;
      localStorage.setItem('myCols', '');
      this.anythingClicked = false;
      this.arePresetsStillCurrent = true;
    } 
  }

  // End checkbox section -----------------------
}
