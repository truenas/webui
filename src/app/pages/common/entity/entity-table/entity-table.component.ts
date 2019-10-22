
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import * as _ from 'lodash';
import { fromEvent as observableFromEvent, Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, take, tap } from 'rxjs/operators';
import { DialogService, JobService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ErdService } from '../../../../services/erd.service';
import { RestService } from '../../../../services/rest.service';
import { StorageService } from '../../../../services/storage.service';
import { WebSocketService } from '../../../../services/ws.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../utils';
import { EntityTableRowDetailsComponent } from './entity-table-row-details/entity-table-row-details.component';

export interface InputTableConf {
  prerequisite?: any;
  globalConfig?: any;
  columns:any[];
  columnFilter?: boolean;
  hideTopActions?: boolean;
  queryCall?: string;
  queryCallOption?: any;
  queryCallJob?: any;
  resource_name?: string;
  route_edit?: string | string[];
  route_add?: string[];
  queryRes?: any [];
  showActions?: boolean;
  isActionVisible?: any;
  custActions?: any[];
  multiActions?:any[];
  multiActionsIconsOnly?:boolean;
  config?: any;
  confirmDeleteDialog?: any;
  checkbox_confirm?: any;
  checkbox_confirm_show?: any;
  hasDetails?:boolean;
  rowDetailComponent?: any;
  detailRowHeight?: any;
  cardHeaderComponent?: any;
  asyncView?: boolean;
  wsDelete?: string;
  wsDeleteParams?(row, id): any;
  addRows?(entity: EntityTableComponent);
  changeEvent?(entity: EntityTableComponent);
  preInit?(entity: EntityTableComponent);
  afterInit?(entity: EntityTableComponent);
  dataHandler?(entity: EntityTableComponent);
  resourceTransformIncomingRestData?(data);
  getActions?(row: any): EntityTableAction[];
  getAddActions?(): any [];
  rowValue?(row, attr): any;
  wsMultiDelete?(resp): any;
  wsMultiDeleteParams?(selected): any;
  updateMultiAction?(selected): any;
  doAdd?();
  onCheckboxChange?(row): any;
  onSliderChange?(row): any;
  callGetFunction?(entity: EntityTableComponent): any;
}

export interface EntityTableAction {
  id: string | number;
  actionName: string;
  icon: string;
  label: string;
  onClick: (row: any) => void;
}

export interface SortingConfig {
  columns: any[];
}

export interface TableConfig {
  paging: boolean;
  sorting: SortingConfig;
}

const DETAIL_HEIGHT = 24;

@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  providers: [DialogService, StorageService]
})
export class EntityTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() title = '';
  @Input('conf') conf: InputTableConf;

  @ViewChild('filter', { static: false}) filter: ElementRef;
  @ViewChild('defaultMultiActions', { static: false}) defaultMultiActions: ElementRef;
  @ViewChild('entityTable', { static: false}) table: any;

  // MdPaginator Inputs
  public paginationPageSize: number = 8;
  public paginationPageSizeOptions = [5, 10, 20, 100, 1000];
  public paginationPageIndex = 0;
  public paginationPageEvent: any;
  public hideTopActions = false;

  public displayedColumns: string[] = [];
  public busy: Subscription;
  public columns: Array<any> = [];
  public rowHeight = 50;
  public zoomLevel: number;
  public tableHeight:number = (this.paginationPageSize * this.rowHeight) + 100;
  public windowHeight: number;

  public allColumns: Array<any> = []; // Need this for the checkbox headings
  public columnFilter = true; // show the column filters by default
  public filterColumns: Array<any> = []; // ...for the filter function - becomes THE complete list of all columns, diplayed or not
  public alwaysDisplayedCols: Array<any> = []; // For cols the user can't turn off
  public anythingClicked: boolean = false; // stores a pristine/touched state for checkboxes
  public originalConfColumns = []; // The 'factory setting
  public colMaxWidths = [];

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
  public cardHeaderReady = false;
  public showActions: boolean = true;
  public entityTableRowDetailsComponent = EntityTableRowDetailsComponent;
  private _multiActionsIconsOnly: boolean = false;
  get multiActionsIconsOnly(){
    return this._multiActionsIconsOnly;
  }
  set multiActionsIconsOnly(value:boolean){
    this._multiActionsIconsOnly = value;
  }

  protected loaderOpen = false;
  public selected = [];
  public removeFromSelectedTotal = 0;

  private interval: any;
  private excuteDeletion = false;

  protected toDeleteRow: any;
  public hasDetails = () =>
    this.conf.rowDetailComponent || (this.allColumns.length > 0 && this.conf.columns.length !== this.allColumns.length);
  public getRowDetailHeight = () =>
     this.hasDetails() && !this.conf.rowDetailComponent
      ? (this.allColumns.length - this.conf.columns.length) * DETAIL_HEIGHT + 76 // add space for padding
      : this.conf.detailRowHeight || 100;


  constructor(protected core: CoreService, protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected erdService: ErdService, protected translate: TranslateService, protected snackBar: MatSnackBar,
    public sorter: StorageService, protected job: JobService, protected prefService: PreferencesService) {
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
    this.cardHeaderReady = this.conf.cardHeaderComponent ? false : true;
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

    for (let item of this.allColumns) {
      if (!item.hidden) {
        this.originalConfColumns.push(item);
      }
    }
    this.conf.columns = this.originalConfColumns;

    setTimeout(() => {
      const preferredCols = this.prefService.preferences.tableDisplayedColumns;
      if (preferredCols.length > 0) {
        preferredCols.forEach((i) => {
          // If preferred columns have been set for THIS table...
          if (i.title === this.title) {
            this.conf.columns = i.cols;
          }
        });
        if (this.title === 'Users') {
          // Makes a list of the table's column maxWidths
          this.filterColumns.forEach((column) => {
            let tempObj = {};
            tempObj['name'] = column.name;
            tempObj['maxWidth'] = column.maxWidth;
            this.colMaxWidths.push(tempObj)
          });
          this.conf.columns = this.dropLastMaxWidth();
        }
      }
    }, this.prefService.preferences.tableDisplayedColumns.length === 0 ? 2000 : 0)

    this.displayedColumns.push("action");
    if (this.conf.changeEvent) {
      this.conf.changeEvent(this);
    }

    if( typeof(this.conf.hideTopActions) !== 'undefined'  ) {
      this.hideTopActions = this.conf.hideTopActions;
    }

    // Delay spinner 500ms so it won't show up on a fast-loading page
    setTimeout(() => { this.setShowSpinner(); }, 500);


      // End of layout section ------------

    this.erdService.attachResizeEventToElement("entity-table-component");
  }

  ngAfterViewInit() {
    if (this.filter) {
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(),)
      .subscribe((evt) => {
        const filterValue: string = this.filter.nativeElement.value;
        let newData: any[] = [];

        if (filterValue.length > 0) {
          this.expandedRows = 0; // TODO: Make this unnecessary by figuring out how to keep expanded rows expanded when filtering
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
    };
  }

  dropLastMaxWidth() {
    // Reset all column maxWidths
    this.conf.columns.forEach((column) => {
      if (this.colMaxWidths.length > 0) {
        column['maxWidth'] = (this.colMaxWidths.find(({name}) => name === column.name)).maxWidth;
      }
    })
    // Delete maXwidth on last col displayed (prevents a display glitch)
    delete (this.conf.columns[Object.keys(this.conf.columns).length-1]).maxWidth;
    return this.conf.columns;
  }

  setTableHeight() {
    let rowNum = 6, n, addRows = 4;
    // if (this.title === 'Boot Environments') {
    //   n = 6;
    // } else 
    if (this.title === 'Jails') {
      n = 4;
    } else if (this.title === 'Virtual Machines') {
      n = 1;
    } else if (this.title === 'Available Plugins' || this.title === 'Installed Plugins') {
      n = 3;
    } else {
      n = 0;
    }
    window.onresize = () => {
      this.zoomLevel = Math.round(window.devicePixelRatio * 100);
      // Browser zoom of exacly 175% causes pagination anomalies; Dropping row size to 49 fixes it
      this.zoomLevel === 175 ? this.rowHeight = 49 : this.rowHeight = 50;
      let x = window.innerHeight;
      let y = x - 830;
      if (this.selected && this.selected.length > 0) {
        this.paginationPageSize = rowNum - n + Math.floor(y/this.rowHeight) + addRows -3;
      } else {
        this.paginationPageSize = rowNum - n + Math.floor(y/this.rowHeight) + addRows;
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
      if (this.conf.queryCallJob) {
        if (this.conf.queryCallOption) {
          this.getFunction = this.ws.job(this.conf.queryCall, this.conf.queryCallOption);
        } else {
          this.getFunction = this.ws.job(this.conf.queryCall, []);
        }
      } else {
        if (this.conf.queryCallOption) {
          this.getFunction = this.ws.call(this.conf.queryCall, this.conf.queryCallOption);
        } else {
          this.getFunction = this.ws.call(this.conf.queryCall, []);
        }
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
        for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
          if (res.data.length > 0 && res.data[0].hasOwnProperty(prop) && typeof res.data[0][prop] === 'string') {
            res.data.map(row => row[prop] = new EntityUtils().parseDOW(row[prop]));
          }
        }
      }
    } else {
      if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
        res = this.conf.resourceTransformIncomingRestData(res);
        for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
          if (res.length > 0 && res[0].hasOwnProperty(prop) && typeof res[0][prop] === 'string') {
            res.map(row => row[prop] = new EntityUtils().parseDOW(row[prop]));
          }
        }
      }
    }

    this.rows = this.generateRows(res);

    if (this.conf.dataHandler) {
      this.conf.dataHandler(this);
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }
    if (!this.showDefaults) {
      this.currentRows = this.filter.nativeElement.value === '' ? this.rows : this.currentRows;
      this.paginationPageIndex  = 0;
      this.setPaginationInfo();
      this.showDefaults = true;
    }
    if ((this.expandedRows == 0 || !this.asyncView || this.excuteDeletion) && this.filter.nativeElement.value === '') {
      this.excuteDeletion = false;
      this.currentRows = this.rows;
      this.paginationPageIndex  = 0;
      this.setPaginationInfo();
    }

    return res;

  }

  generateRows(res): Array<any> {
    let rows: any[] = [];
    if (this.loaderOpen) {
      this.loader.close();
      this.loaderOpen = false;
    }

    if (res.data) {
      if (res.data.result) {
        rows = new EntityUtils().flattenData(res.data.result);
      } else {
        rows = new EntityUtils().flattenData(res.data);
      }
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
      for (let i = 0; i < this.currentRows.length; i++) {
        const index = _.findIndex(rows, {id: this.currentRows[i].id});
        if (index > -1) {
          for (let prop in rows[index]) {
            this.currentRows[i][prop] = rows[index][prop];
          }
        }
      }

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
        name: 'edit',
        id: "edit",
        icon: 'edit',
        label: T("Edit"),
        onClick: (rowinner) => { this.doEdit(rowinner.id); },
      }, {
        name: 'delete',
        id: "delete",
        icon: 'delete',
        label: T("Delete"),
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
    const deleteMsg =
      this.conf.confirmDeleteDialog && this.conf.confirmDeleteDialog.isMessageComplete
        ? ''
        : this.getDeleteMessage(item);

    let id;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop];
    } else {
      id = item.id;
    }
    if (this.conf.checkbox_confirm && this.conf.checkbox_confirm_show && this.conf.checkbox_confirm_show(id)) {
      this.conf.checkbox_confirm(id, deleteMsg);
      return;
    }

    const dialog = this.conf.confirmDeleteDialog || {};
    if (dialog.buildTitle) {
      dialog.title = dialog.buildTitle(item);
    }

    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.doubleConfirm) {
      // double confirm: input delete item's name to confirm deletion
      this.conf.config.deleteMsg.doubleConfirm(item).subscribe((doubleConfirmDialog) => {
        if (doubleConfirmDialog) {
          this.toDeleteRow = item;
          this.delete(id);
        }
      });
    } else {
      this.dialogService.confirm(
        dialog.hasOwnProperty("title") ? dialog['title'] : T("Delete"),
        dialog.hasOwnProperty("message") ? dialog['message'] + deleteMsg : deleteMsg,
        dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : false,
        dialog.hasOwnProperty("button") ? dialog['button'] : T("Delete")).subscribe((res) => {
          if (res) {
            this.toDeleteRow = item;
            this.delete(id);
          }
        });
    }
  }

  delete(id) {
    this.loader.open();
    this.loaderOpen = true;
    const data = {};
    if (this.conf.wsDelete) {
      this.busy = this.ws.call(this.conf.wsDelete, (this.conf.wsDeleteParams? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id])).subscribe(
        (resinner) => {
          this.getData();
          this.excuteDeletion = true;
        },
        (resinner) => {
          new EntityUtils().handleWSError(this, resinner, this.dialogService);
          this.loader.close();
        }
      )
    } else {
      this.busy = this.rest.delete(this.conf.resource_name + '/' + id, data).subscribe(
        (resinner) => {
          this.getData();
          this.excuteDeletion = true;
        },
        (resinner) => {
          new EntityUtils().handleError(this, resinner);
          this.loader.close();
        }
      );
    }
  }

  doDeleteJob(item: any): Observable<{ state: 'SUCCESS' | 'FAILURE' } | false> {
    const deleteMsg = this.getDeleteMessage(item);
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

    return this.dialogService
      .confirm(
        dialog.hasOwnProperty("title") ? dialog["title"] : T("Delete"),
        dialog.hasOwnProperty("message") ? dialog["message"] + deleteMsg : deleteMsg,
        dialog.hasOwnProperty("hideCheckbox") ? dialog["hideCheckbox"] : false,
        dialog.hasOwnProperty("button") ? dialog["button"] : T("Delete")
      )
      .pipe(
        filter(ok => !!ok),
        tap(() => {
          this.loader.open();
          this.loaderOpen = true;
        }),
        switchMap(() =>
          (this.conf.wsDelete
            ? this.ws.call(this.conf.wsDelete, [id])
            : this.rest.delete(this.conf.resource_name + "/" + id, {})
          ).pipe(
            take(1),
            catchError(error => {
              new EntityUtils().handleWSError(this, error, this.dialogService);
              this.loader.close();
              return of(false);
            })
          )
        ),
        switchMap(jobId => (jobId ? this.job.getJobStatus(jobId) : of(false)))
      );
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
      this.tableHeight = (this.currentRows.length * this.rowHeight) + 110;
    } else {
      this.tableHeight = (this.paginationPageSize * this.rowHeight) + 100;
    }

    // Displays an accurate number for some edge cases
    if (this.paginationPageSize > this.currentRows.length) {
      this.paginationPageSize = this.currentRows.length;
    }
  }

  reorderEvent(event) {
    const configuredShowActions = this.showActions;
    this.showActions = false;
    this.paginationPageIndex = 0;
    let sort = event.sorts[0],
      rows = this.currentRows;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
    this.rows = rows;
    this.setPaginationInfo();
    setTimeout(() => {
      this.showActions = configuredShowActions;
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
    this.removeFromSelectedTotal = 0;
    let checkable = 0;
    selected.forEach((i) => {
      i.hideCheckbox ? this.removeFromSelectedTotal++ : checkable++;
    });
    if (checkable === 0) {
      selected.length = 0;
    };
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
    this.selectColumnsToShowOrHide();
    this.updateTableHeightAfterDetailToggle();
  }

  // Stores currently selected columns in preference service
  selectColumnsToShowOrHide() {
    let obj = {};
    obj['title'] = this.title;
    obj['cols'] = this.conf.columns;

    let preferredCols = this.prefService.preferences.tableDisplayedColumns;
    if (preferredCols.length > 0) {
      preferredCols.forEach((i) => {
        if (i.title === this.title) {
          preferredCols.splice(preferredCols.indexOf(i), 1);
        }
      });
    }
    preferredCols.push(obj);
    this.prefService.savePreferences(this.prefService.preferences);
    if (this.title === 'Users') {
      this.conf.columns = this.dropLastMaxWidth();
    }
  }

  // resets col view to the default set in the table's component
  resetColViewToDefaults() {
    this.conf.columns = this.originalConfColumns;
    this.updateTableHeightAfterDetailToggle();
    this.selectColumnsToShowOrHide();
  }

  isChecked(col:any) {
    return this.conf.columns.find(c => {
      return c.name === col.name;
    }) !=undefined;
  }

  // Toggle between all/none cols selected
  checkAll() {
    this.anythingClicked = true;
    if (this.conf.columns.length < this.allColumns.length) {
      this.conf.columns = this.allColumns;
      this.selectColumnsToShowOrHide();
    } else {
      this.conf.columns = [];
      this.selectColumnsToShowOrHide();
    }
    this.updateTableHeightAfterDetailToggle();
    return this.conf.columns
  }

  // Used by the select all checkbox to determine whether it should be checked
  checkLength() {
    if (this.allColumns && this.conf.columns) {
      return this.conf.columns.length === this.allColumns.length;
    }
  }
  // End checkbox section -----------------------

  toggleLabels(){
    this.multiActionsIconsOnly = !this.multiActionsIconsOnly;
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
    this.updateTableHeightAfterDetailToggle();
  }

  resetTableToStartingHeight() {
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }
    document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', `height: ${this.startingHeight}px`);
  }

  updateTableHeightAfterDetailToggle() {
    if (!this.startingHeight) {
      this.resetTableToStartingHeight();
    }
    setTimeout(() => {
      this.expandedRows = document.querySelectorAll('.datatable-row-detail').length;
      const newHeight = this.expandedRows * this.getRowDetailHeight() + this.startingHeight;
      const heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 0);
  }

  getButtonClass(prop) {
    switch(prop) {
      case 'RUNNING' : return 'fn-theme-orange';
      case 'FINISHED' : return 'fn-theme-green';
      case 'SUCCESS' : return 'fn-theme-green';
      case 'ERROR' : return 'fn-theme-red';
      case 'FAILED' : return 'fn-theme-red';
      default: return 'fn-theme-primary';
    }
  }

  stateClickable(value, colConfig) {
    if (colConfig.infoStates) {
      return _.indexOf(colConfig.infoStates, value) < 0;
    } else {
      return value !== 'PENDING';
    }
  }
}
