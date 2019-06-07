
import {fromEvent as observableFromEvent,  Observable ,  BehaviorSubject ,  Subscription } from 'rxjs';

import {distinctUntilChanged, debounceTime} from 'rxjs/operators';
import { Component, OnInit, OnDestroy ,Input, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort, PageEvent, MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

//local libs
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services';
import { ErdService } from '../../../../services/erd.service';
import { StorageService } from '../../../../services/storage.service'
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { T } from '../../../../translate-marker';

export interface InputTableConf {
  prerequisite?: any;
  globalConfig?: any;
  columns:any[];
  columnFilter?: boolean;
  hideTopActions?: boolean;
  queryCall?: string;
  queryCallOption?: any;
  resource_name?: string;
  route_edit?: string;
  route_add?: string[];
  queryRes?: any [];
  showActions?: boolean;
  isActionVisible?: any;
  custActions?: any[];
  multiActions?:any[];
  multiActionsIconsOnly?:boolean;
  config?: any;
  confirmDeleteDialog?: Object;
  checkbox_confirm?: any;
  checkbox_confirm_show?: any;
  hasDetails?:boolean;
  rowDetailComponent?: any;
  cardHeaderComponent?: any;
  asyncView?: boolean;
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
  doAdd?();
  onCheckboxChange?(row): any;
  onSliderChange?(row): any;
  callGetFunction?(entity: EntityTableComponent): any;
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
  providers: [DialogService, StorageService]
})
export class EntityTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() title = '';
  @Input() legacyWarning = '';
  @Input() legacyWarningLink = '';
  @Input('conf') conf: InputTableConf;

  @ViewChild('filter') filter: ElementRef;
  @ViewChild('defaultMultiActions') defaultMultiActions: ElementRef;
  @ViewChild('entityTable') table: any;

  // MdPaginator Inputs
  public paginationPageSize: number = 8;
  public paginationPageSizeOptions = [5, 10, 20, 100, 1000];
  public paginationPageIndex = 0;
  public paginationPageEvent: any;
  public hideTopActions = false;

  public displayedColumns: string[] = [];
  public busy: Subscription;
  public columns: Array<any> = [];
  public tableHeight:number = (this.paginationPageSize * 50) + 100;
  public windowHeight: number;

  public allColumns: Array<any> = []; // Need this for the checkbox headings
  public columnFilter = true; // show the column filters by default
  public filterColumns: Array<any> = []; // ...for the filter function - becomes THE complete list of all columns, diplayed or not
  public alwaysDisplayedCols: Array<any> = []; // For cols the user can't turn off
  public presetDisplayedCols: Array<any> = []; // to store only the index of preset cols
  public currentPreferredCols: Array<any> = []; // to store current choice of what cols to view
  public anythingClicked: boolean = false; // stores a pristine/touched state for checkboxes

  public startingHeight: number;
  public expandedRows = 0;

  public rows: any[] = [];
  public currentRows: any[] = []; // Rows applying filter
  public seenRows: any[] = [];
  public getFunction;
  public config: TableConfig = {
    paging: true,
    sorting: { columns: this.columns },
  };
  public asyncView = false; //default table view is not async
  public showDefaults: boolean = false;
  public showSpinner: boolean = false;
  public showActions: boolean = true;
  private _multiActionsIconsOnly: boolean = false;
  get multiActionsIconsOnly(){
    return this._multiActionsIconsOnly;
  }
  set multiActionsIconsOnly(value:boolean){
    this._multiActionsIconsOnly = value;
  }

  protected loaderOpen = false;
  public selected = [];

  private interval: any;

  constructor(protected core: CoreService, protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService, 
    protected erdService: ErdService, protected translate: TranslateService, protected snackBar: MatSnackBar,
    public sorter: StorageService) { 
      this.core.register({observerClass:this, eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
        this.multiActionsIconsOnly = evt.data.preferIconsOnly;
      });
      this.core.emit({name:"UserPreferencesRequest"}); 
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
    clearInterval(this.interval);
  }

  ngOnInit() {

    this.setTableHeight(); 

    setTimeout(async() => {
      if (this.conf.prerequisite) {
        await this.conf.prerequisite().then(
          (res)=>{
            if (res) {
              if (this.conf.preInit) {
                this.conf.preInit(this);
              }
              this.getData();
              if (this.conf.afterInit) {
                this.conf.afterInit(this);
              }
            }
          }
        );
      } else {
        if (this.conf.preInit) {
          this.conf.preInit(this);
        }
        this.getData();
        if (this.conf.afterInit) {
          this.conf.afterInit(this);
        }
      }
    })
    this.asyncView = this.conf.asyncView ? this.conf.asyncView : false;
    this.conf.columns.forEach((column) => {
      this.displayedColumns.push(column.prop);
      if (!column.always_display) {
        this.allColumns.push(column); // Make array of optionally-displayed cols
      } else {
        this.alwaysDisplayedCols.push(column); // Make an array of required cols
      }
    });
    this.columnFilter = this.conf.columnFilter === undefined ? true : this.conf.columnFilter;
    this.showActions = this.conf.showActions === undefined ? true : this.conf.showActions ;
    this.filterColumns = this.conf.columns;
    this.conf.columns = this.allColumns; // Remove any alwaysDisplayed cols from the official list

    this.displayedColumns.push("action");
    if (this.conf.changeEvent) {
      this.conf.changeEvent(this);
    }

    if( typeof(this.conf.hideTopActions) !== 'undefined'  ) {
      this.hideTopActions = this.conf.hideTopActions;
    }


      // Delay spinner 500ms so it won't show up on a fast-loading page
      setTimeout(() => { this.setShowSpinner(); }, 500);

      // Next section sets the checked/displayed columns
      if (this.conf.columns && this.conf.columns.length > 9) {
        this.conf.columns = [];

        for (let item of this.allColumns) {
          if (!item.hidden) {
            this.conf.columns.push(item);
            this.presetDisplayedCols.push(item);
          }
        }

        this.currentPreferredCols = this.conf.columns;
      }
        // End of checked/display section ------------                 

    this.erdService.attachResizeEventToElement("entity-table-component");
  }

  ngAfterViewInit() {
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(),)
      .subscribe((evt) => {
        const filterValue: string = this.filter.nativeElement.value;
        let newData: any[] = [];

        if (filterValue.length > 0) {
          this.rows.forEach((dataElement) => {
            for (const dataElementProp of this.filterColumns) {
              let value: any = dataElement[dataElementProp.prop];

              if( typeof(value) === "boolean" || typeof(value) === "number") {
                value = String(value).toLowerCase();
              }
              if (Array.isArray(value)) {
                let tempStr = '';
                value.forEach((item) => {
                  if (typeof(item) === 'string') {
                    tempStr += ' ' + item;
                  } else if (typeof(value) === "boolean" || typeof(value) === "number") {
                    tempStr += String(value);
                  }
                })
                value = tempStr.toLowerCase();
              }
              if (typeof (value) === "string" && value.length > 0 &&
                (<string>value.toLowerCase()).indexOf(filterValue.toLowerCase()) >= 0) {
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

      // Delay spinner 500ms so it won't show up on a fast-loading page
      setTimeout(() => { this.setShowSpinner(); }, 500);

      // Next section sets the checked/displayed columns
      if (this.conf.columns && this.conf.columns.length > 10) {
        this.conf.columns = [];

        for (let item of this.allColumns) {
          if (!item.hidden) {
            this.conf.columns.push(item);
            this.presetDisplayedCols.push(item);
          }
        }

        this.currentPreferredCols = this.conf.columns;
      }
        // End of checked/display section ------------                 
  }

  setTableHeight() {
    let rowNum = 6, n, addRows = 4;
    if (this.title === 'Boot Environments') {
      n = 6;
    } else if (this.title === 'Jails') {
      n = 4;
    } else if (this.title === 'Virtual Machines') {
      n = 6;
    } else if (this.title === 'Available Plugins' || this.title === 'Installed Plugins') {
      n = 3;
    } else {
      n = 0;
    }
    window.onresize = () => {
      let x = window.innerHeight;
      let y = x - 830;
      if (this.selected && this.selected.length > 0) {
        this.paginationPageSize = rowNum - n + Math.floor(y/50) + addRows -3;
      } else {
        this.paginationPageSize = rowNum - n + Math.floor(y/50) + addRows;
      }

      if (this.paginationPageSize < 2) {
        this.paginationPageSize = 2;
      }
      this.setPaginationInfo();
    }
  }

  setShowSpinner() {
    this.showSpinner = true;
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

    if (this.conf.callGetFunction) {
      this.conf.callGetFunction(this);
    } else {
      this.callGetFunction();
    }
    if (this.asyncView) {
      this.interval = setInterval(() => {
        if (this.conf.callGetFunction) {
          this.conf.callGetFunction(this);
        } else {
          this.callGetFunction();
        }
      }, 10000);
    }

  }

  callGetFunction() {
    this.getFunction.subscribe(
      (res) => {
        this.handleData(res);
      },
      (res) => {
        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (res.hasOwnProperty("reason") && (res.hasOwnProperty("trace") && res.hasOwnProperty("type"))) {
          this.dialogService.errorReport(res.type, res.reason, res.trace.formatted);
        }
        else {
          new EntityUtils().handleError(this, res);
        }
      }
    );
  };

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

    this.rows = this.generateRows(res);

    if (this.conf.dataHandler) {
      this.conf.dataHandler(this);
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }

    this.currentRows = this.filter.nativeElement.value === '' ? this.rows : this.currentRows;
    this.paginationPageIndex  = 0;
    this.setPaginationInfo();
    this.showDefaults = true;
    return res;

  }

  generateRows(res): Array<any> {
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

    for (let i = 0; i < rows.length; i++) {
      for (const attr in rows[i]) {
        if (rows[i].hasOwnProperty(attr)) {
          rows[i][attr] = this.rowValue(rows[i], attr);
        }
      }
    }

    if (this.rows.length === 0) {
      if (this.conf.queryRes) {
        this.conf.queryRes = rows;
      }

      if (this.conf.queryRes) {
        this.conf.queryRes = rows;
      }
    } else {
      const newCurrentRows = this.currentRows;
      for (let i = 0; i < newCurrentRows.length; i++) {
        const index = _.findIndex(rows, {id: newCurrentRows[i].id});
        if (index > -1) {
          newCurrentRows[i] = rows[index];
        }
      }
      this.currentRows = newCurrentRows;

      const newRows = [];
      for (let i = 0; i < this.rows.length; i++) {
        const index = _.findIndex(rows, {id: this.rows[i].id});
        if (index < 0) {
          continue;
        }
        const updatedItem = rows[index];
        rows.splice(index, 1);
        newRows.push(updatedItem);
      }
      return newRows.concat(rows);
    }
    return rows;
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
        onClick: (rowinner) => { this.doDelete(rowinner); },
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

  convertDisplayValue(value) {
    let val;
    if (value === true) {
      this.translate.get('yes').subscribe((yes) => {
        val = yes;
      });
    } else if (value === false) {
      this.translate.get('no').subscribe((no) => {
        val = no;
      });
    } else {
      val = value;
    }
    return val;
  }

  doAdd() {
    if (this.conf.doAdd) {
      this.conf.doAdd();
    } else {
      this.router.navigate(new Array('/').concat(this.conf.route_add));
    }
  }

  doEdit(id) {
    this.router.navigate(
      new Array('/').concat(this.conf.route_edit).concat(id));
  }

  //generate delete msg
  getDeleteMessage(item) {
    let deleteMsg = "Delete the selected item?";
    if (this.conf.config.deleteMsg) {
      deleteMsg = "Delete " + this.conf.config.deleteMsg.title;
      let msg_content = ' <b>' + item[this.conf.config.deleteMsg.key_props[0]];
      if (this.conf.config.deleteMsg.key_props.length > 1) {
        for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
          if (item[this.conf.config.deleteMsg.key_props[i]] != '') {
            msg_content = msg_content + ' - ' + item[this.conf.config.deleteMsg.key_props[i]];
          }
        }
      }
      msg_content += "</b>?";
      deleteMsg += msg_content;
    }
    this.translate.get(deleteMsg).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doDelete(item) {
    let deleteMsg = this.getDeleteMessage(item);
    let id;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop];
    } else {
      id = item.id;
    }
    let dialog = {};
    if (this.conf.checkbox_confirm && this.conf.checkbox_confirm_show && this.conf.checkbox_confirm_show(id)) {
      this.conf.checkbox_confirm(id, deleteMsg);
      return;
    }
    if (this.conf.confirmDeleteDialog) {
      dialog = this.conf.confirmDeleteDialog;
    }

    this.dialogService.confirm(
        dialog.hasOwnProperty("title") ? dialog['title'] : T("Delete"),
        dialog.hasOwnProperty("message") ? dialog['message'] + deleteMsg : deleteMsg,
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
              new EntityUtils().handleWSError(this, resinner, this.dialogService);
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

    if( beginIndex < this.currentRows.length && endIndex >= this.currentRows.length) {
      this.seenRows = this.currentRows.slice(beginIndex, this.currentRows.length);
    } else if( endIndex < this.currentRows.length ) {
      this.seenRows = this.currentRows.slice(beginIndex, endIndex);
    } else {
      this.seenRows = this.currentRows;
    }

    // This section controls page height for infinite scrolling
    if (this.currentRows.length === 0) {
      this.tableHeight = 153;
    } else if (this.currentRows.length > 0 && this.currentRows.length < this.paginationPageSize) {
      this.tableHeight = (this.currentRows.length * 50) + 110;
    } else {
      this.tableHeight = (this.paginationPageSize * 50) + 100;
    } 
    
    // Displays an accurate number for some edge cases
    if (this.paginationPageSize > this.currentRows.length) {
      this.paginationPageSize = this.currentRows.length;
    }
  }

  reorderEvent(event) {
    this.showActions = false;
    this.paginationPageIndex = 0;
    let sort = event.sorts[0],
      rows = this.currentRows;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
    this.rows = rows;
    this.setPaginationInfo();
    setTimeout(() => {
      this.showActions = true;
    }, 50)
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

  getMultiDeleteMessage(items) {
    let deleteMsg = "Delete the selected items?";
    if (this.conf.config.deleteMsg) {
      deleteMsg = "Delete selected " + this.conf.config.deleteMsg.title + "(s)?";
      let msg_content = "<ul>";
      for (let j = 0; j < items.length; j++) {
        let sub_msg_content = '<li>' + items[j][this.conf.config.deleteMsg.key_props[0]];
        if (this.conf.config.deleteMsg.key_props.length > 1) {
          for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
            if (items[j][this.conf.config.deleteMsg.key_props[i]] != '') {
              msg_content = msg_content + ' - ' + items[j][this.conf.config.deleteMsg.key_props[i]];
            }
          }
        }
        sub_msg_content += "</li>";
        msg_content += sub_msg_content;
      }
      msg_content += "</ul>";
      deleteMsg += msg_content;
    }
    this.translate.get(deleteMsg).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doMultiDelete(selected) {
    let multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm("Delete", multiDeleteMsg, false, T("Delete")).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        if (this.conf.wsMultiDelete) {
          // ws to do multi-delete
          if (this.conf.wsMultiDeleteParams) {
            this.busy = this.ws.job(this.conf.wsMultiDelete, this.conf.wsMultiDeleteParams(selected)).subscribe(
              (res1) => {
                if (res1.state === 'SUCCESS') {
                  this.loader.close();
                  this.loaderOpen = false;
                  this.getData();
                  this.selected = [];

                  const selectedName = this.conf.wsMultiDeleteParams(selected)[1];
                  let message = "";
                  for (let i = 0; i < res1.result.length; i++) {
                    if (res1.result[i].error != null) {
                      message = message + '<li>' + selectedName[i] + ': ' + res1.result[i].error + '</li>';
                    }
                  }
                  if (message === "") {
                    this.snackBar.open("Items deleted.", 'close', { duration: 5000 });
                  } else {
                    message = '<ul>' + message + '</ul>';
                    this.dialogService.errorReport(T('Items Delete Failed'), message);
                  }
                }
               },
              (res1) => {
                new EntityUtils().handleWSError(this, res1, this.dialogService);
                this.loader.close();
                this.loaderOpen = false;
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
    this.setTableHeight();
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

  onGoToLegacy() {
    this.dialogService.confirm(T("Log in to Legacy User Interface?"), "", true, T('Continue')).subscribe((res) => {
      if (res) {
        window.location.href = '/legacy/';
      }
    });
  }

  // End checkbox section -----------------------
  toggleLabels(){
    this.multiActionsIconsOnly = !this.multiActionsIconsOnly;
  }

  toggleExpandRow(row) {
    //console.log('Toggled Expand Row!', row);
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }  
    this.table.rowDetail.toggleExpandRow(row);
    setTimeout(() => {
      this.expandedRows = (document.querySelectorAll('.datatable-row-detail').length);
      let newHeight = (this.expandedRows * 100) + this.startingHeight;
      let heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 100)
    
  }

  onDetailToggle(event) {
    //console.log('Detail Toggled', event);
}
}
