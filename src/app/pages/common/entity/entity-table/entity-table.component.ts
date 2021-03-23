import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { Router, NavigationStart } from '@angular/router';
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
import { ModalService } from '../../../../services/modal.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../utils';

import { EntityTableService } from './entity-table.service';
import { EntityTableRowDetailsComponent } from './entity-table-row-details/entity-table-row-details.component';
import { EntityTableAddActionsComponent } from './entity-table-add-actions.component';
import { EntityJobComponent } from '../entity-job/entity-job.component';

import { CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';

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
  noActions?: boolean;
  config?: any;
  confirmDeleteDialog?: any;
  hasDetails?:boolean;
  rowDetailComponent?: any;
  detailRowHeight?: any;
  cardHeaderComponent?: any;
  asyncView?: boolean;
  wsDelete?: string;
  noAdd?: boolean;
  actionsConfig?: { actionType: any, actionConfig: any };
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
  doEdit?(id?:any);
  onCheckboxChange?(row): any;
  onSliderChange?(row): any;
  callGetFunction?(entity: EntityTableComponent): any;
  prerequisiteFailedHandler?(entity: EntityTableComponent);
  afterDelete?();
  addComponent?();
  editComponent?();
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

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: any;
  options?: any[]; // Function parameters
} 

const DETAIL_HEIGHT = 24;

@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
  providers: [DialogService, StorageService],
  animations:[
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class EntityTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() public title = '';
  @Input() public conf: InputTableConf;
  
  @ViewChild('defaultMultiActions', { static: false}) defaultMultiActions: ElementRef;
  @ViewChild('newEntityTable', { static: false}) entitytable: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(CdkVirtualScrollViewport, { static: false}) viewport: CdkVirtualScrollViewport;
  
  public filter: ElementRef;
  public scrollContainer: HTMLElement;
  public scrolledIndex: number = 0;
  public tableMouseEvent: MouseEvent;
  // MdPaginator Inputs
  public paginationPageSize: number = 10;
  public paginationPageSizeOptions: number[] = [5, 10, 25, 100];
  public paginationPageIndex: number = 0;
  public paginationShowFirstLastButtons: boolean = true;
  public hideTopActions: boolean = false;
  public displayedColumns: string[] = [];
  public firstUse: boolean = true;
  public emptyTableConf: EmptyConfig = {
    type: EmptyType.loading,
    large: true,
    title: this.title,
  };
  public isTableEmpty = true;
  public selection = new SelectionModel<any>(true, []);
  public busy: Subscription;
  public columns: Array<any> = [];
  public rowHeight = 50;
  public zoomLevel: number;
  public tableHeight:number = (this.paginationPageSize * this.rowHeight) + 100;
  public fixedTableHight = false;
  public cardHeaderComponentHight = 0;
  public windowHeight: number;

  public oldPagesize;
  public activatedRowIndex;

  public allColumns: Array<any> = []; // Need this for the checkbox headings
  public columnFilter = true; // show the column filters by default
  public filterColumns: Array<any> = []; // ...for the filter function - becomes THE complete list of all columns, diplayed or not
  public alwaysDisplayedCols: Array<any> = []; // For cols the user can't turn off
  public anythingClicked: boolean = false; // stores a pristine/touched state for checkboxes
  public originalConfColumns = []; // The 'factory setting
  public colMaxWidths = [];

  public startingHeight: number;
  public expandedRows = document.querySelectorAll('.expanded-row').length;
  public expandedElement: any | null = null;

  public dataSource: MatTableDataSource<any>;
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
  public removeFromSelectedTotal = 0;
  public hasActions = true;
  public sortKey: string;
  
  // Global Actions in Page Title 
  protected actionsConfig: any;
  protected loaderOpen = false;
  protected toDeleteRow: any;
  private interval: any;
  private excuteDeletion = false;
  private needRefreshTable = false;
  private needTableResize = true;
  private routeSub: any;
  private _multiActionsIconsOnly: boolean = false;
  
  public get multiActionsIconsOnly(){
    return this._multiActionsIconsOnly;
  }
  
  public set multiActionsIconsOnly(value:boolean){
    this._multiActionsIconsOnly = value;
  }
  
  public get currentColumns(): any[] {
    const result = this.alwaysDisplayedCols.concat(this.conf.columns);

    // Actions without expansion
    if(this.hasActions && result[result.length - 1] !== 'action' && (this.hasDetails() === false || !this.hasDetails)){
      result.push({ prop: 'action'});
    }

    // Expansion
    if(this.hasDetails() === true){
      result.push({ prop: 'expansion-chevrons'});
    }

    if(this.conf.config.multiSelect){
      result.unshift({prop: 'multiselect'});
    }

    return result;
  }

  public hasDetails = () =>
    this.conf.rowDetailComponent || (this.allColumns.length > 0 && this.conf.columns.length !== this.allColumns.length);

  public getRowDetailHeight = () =>
    this.hasDetails() && !this.conf.rowDetailComponent
    ? (this.allColumns.length - this.conf.columns.length) * DETAIL_HEIGHT + 76 // add space for padding
    : this.conf.detailRowHeight || 100;
    
  public get isAllSelected() {
    return this.selection.selected.length === this.currentRows.length;
  }

  constructor(protected core: CoreService, protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected erdService: ErdService, protected translate: TranslateService,
    public storageService: StorageService, protected job: JobService, protected prefService: PreferencesService,
    protected matDialog: MatDialog, public modalService: ModalService, public tableService: EntityTableService ) {

      this.core.register({observerClass:this, eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
        this.multiActionsIconsOnly = evt.data.preferIconsOnly;
      });
      this.core.emit({name:"UserPreferencesRequest", sender:this});
      // watch for navigation events as ngOnDestroy doesn't always trigger on these
      this.routeSub = this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.cleanup();
        }
      });
  }

  ngOnDestroy(){
    this.cleanup();
  }

  cleanup() {
    this.core.unregister({observerClass:this});
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (!this.routeSub.closed) {
      this.routeSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.actionsConfig = { actionType: EntityTableAddActionsComponent, actionConfig: this };
    this.cardHeaderReady = this.conf.cardHeaderComponent ? false : true;
    this.hasActions = this.conf.noActions === true ? false : true;
    if (this.conf.config?.pagingOptions?.pageSize) {
      this.paginationPageSize = this.conf.config.pagingOptions.pageSize;
    }
    if (this.conf.config?.pagingOptions?.pageSizeOptions) {
      this.paginationPageSizeOptions = this.conf.config.pagingOptions.pageSizeOptions;
    }
    
    this.sortKey = (this.conf.config.deleteMsg && this.conf.config.deleteMsg.key_props) ? this.conf.config.deleteMsg.key_props[0] : this.conf.columns[0].prop;
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
            } else {
              this.showSpinner = false;
              if (this.conf.prerequisiteFailedHandler) {
                this.conf.prerequisiteFailedHandler(this);
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

    this.conf.columns.forEach((column, index) => {
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

    for (const item of this.allColumns) {
      if (!item.hidden) {
        this.originalConfColumns.push(item);
      }
    }
    this.conf.columns = this.originalConfColumns;

    setTimeout(() => {
      const preferredCols = this.prefService.preferences.tableDisplayedColumns;
      // Turn off preferred cols for snapshots to allow for two diffferent column sets to be displayed
      if (preferredCols.length > 0 && this.title !== 'Snapshots') {
        preferredCols.forEach((i) => {
          // If preferred columns have been set for THIS table...
          if (i.title === this.title) {
            this.firstUse = false;
            this.conf.columns = i.cols.filter(col => {
              // Remove columns if they are already present in always displayed columns
              return !this.alwaysDisplayedCols.find(item => item.prop === col.prop)
            });
            // Remove columns from display and preferred cols if they don't exist in the table
            const notFound = [];
            this.conf.columns.forEach(col => {
              const found = this.filterColumns.find(o => o.prop === col.prop);
              if (!found) {
                notFound.push(col.prop);
              }
            })
            this.conf.columns = this.conf.columns.filter(col => !notFound.includes(col.prop));
            this.selectColumnsToShowOrHide();
          }
        });
        if (this.title === 'Users') {
          // Makes a list of the table's column maxWidths
          this.filterColumns.forEach((column) => {
            const tempObj = {};
            tempObj['name'] = column.name;
            tempObj['maxWidth'] = column.maxWidth;
            this.colMaxWidths.push(tempObj)
          });
          this.conf.columns = this.dropLastMaxWidth();
        }
      }
      if (this.firstUse) {
        this.selectColumnsToShowOrHide();
      }
    }, this.prefService.preferences.tableDisplayedColumns.length === 0 ? 200 : 0)

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
  }

  ngAfterViewInit() {
    // Setup Actions in Page Title Component
    this.core.emit({ name:"GlobalActions", data: this.actionsConfig, sender: this});
  }

  filterInit(){
    if (this.filter) {
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(),)
      .subscribe((evt) => {
        const filterValue: string = this.filter.nativeElement.value;

        if (filterValue.length > 0) {
          this.dataSource.filter = filterValue;
        } else {
          this.dataSource.filter = '';
        }

        if(this.dataSource.filteredData && this.dataSource.filteredData.length) {
          this.isTableEmpty = false;
        } else {
          this.isTableEmpty = true;
          this.emptyTableConf = {
            type: EmptyType.no_search_results,
            large: true,
            title: T("No Search Results."),
            message: T(`Your query didn't return any results. Please try again.`)
          };
        }

        if (this.dataSource.paginator && this.conf.config.paging) {
          this.dataSource.paginator.firstPage();
        }
      });
    }

  }

  dropLastMaxWidth() {
    // Reset all column maxWidths
    this.conf.columns.forEach((column) => {
      if (this.colMaxWidths.length > 0) {
        column['maxWidth'] = (this.colMaxWidths.find(({name}) => name === column.name)).maxWidth;
      }
    })
    // Delete maXwidth on last col displayed (prevents a display glitch)
    if (this.conf.columns.length > 0) {
      delete (this.conf.columns[Object.keys(this.conf.columns).length-1]).maxWidth;
    }
    return this.conf.columns;
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
          this.callGetFunction(true);
        }
      }, 10000);
    }

  }

  callGetFunction(skipActions=false) {
    this.getFunction.subscribe(
      (res) => {
        this.handleData(res, skipActions);
      },
      (res) => {
        this.isTableEmpty = true;
        this.emptyTableConf = {
          title: T("Something went wrong"),
          message: T(`The system returned the following error - `)+res,
          large: true,
          type: EmptyType.errors
        }
        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (res.hasOwnProperty("reason") && (res.hasOwnProperty("trace") && res.hasOwnProperty("type"))) {
          this.dialogService.errorReport(res.type || res.trace.class, res.reason, res.trace.formatted);
        }
        else {
          new EntityUtils().handleError(this, res);
        }
      }
    );
  };

  handleData(res, skipActions=false): any {
    this.expandedRows = document.querySelectorAll('.expanded-row').length;
    const cache = this.expandedElement;
    this.expandedElement = this.expandedRows > 0 ? cache : null;

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
    if (!skipActions) {
      this.storageService.tableSorter(this.rows, this.sortKey, 'asc')
    }
    if (this.conf.dataHandler) {
      this.conf.dataHandler(this);
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }
    if (!this.showDefaults) {
      this.currentRows = this.filter && this.filter.nativeElement.value === '' ? this.rows : this.currentRows;
      this.paginationPageIndex  = 0;
      this.showDefaults = true;
    }
    if ((this.expandedRows === 0 || !this.asyncView || this.excuteDeletion || this.needRefreshTable) && this.filter && this.filter.nativeElement.value === '') {
      this.excuteDeletion = false;
      this.needRefreshTable = false;
      
      this.needTableResize = true;
      this.currentRows = this.rows;
      this.paginationPageIndex  = 0;
    }

    if(this.currentRows && this.currentRows.length > 0) {
      this.isTableEmpty = false;
    } else {
      this.isTableEmpty = true;
      if(this.firstUse) {
        this.emptyTableConf = {
          type: EmptyType.first_use,
          large: true,
          title: T("No ")+this.title,
          message: T(`It seems you haven't setup any `) + this.title + T(` yet.`)
        };
        
      } else {
        this.emptyTableConf = {
          type: EmptyType.no_page_data,
          large: true,
          title: T("No ")+this.title,
          message: T(`The system could not retrieve any `) + this.title + T(` from the database.`)
        };
      }
      if(!this.conf.noAdd) {
        this.emptyTableConf['message'] += T(` Please click the button below to add `) + this.title + T(`.`);
        this.emptyTableConf['button'] = {
          label: T("Add ")+this.title,
          action: this.doAdd.bind(this),
        };
      }
    }

    this.dataSource = new MatTableDataSource(this.currentRows);
    this.dataSource.sort = this.sort;

    if (this.conf.config.paging) {
      //On first load, paginator is not rendered because table is empty, so we force render here so that we can get valid paginator instance
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      }, 0);
    }

    return res;

  }

  isLeftStickyColumnNo(i) {
    return i === (this.currentColumns[0].prop === 'multiselect' ? 1 : 0);
  }

  shouldApplyStickyOffset(i) {
    return this.currentColumns[0].prop === 'multiselect' && i === 1;
  }

  isTableOverflow() {
    let hasHorizontalScrollbar = false;
    if(this.entitytable) {
      hasHorizontalScrollbar = this.entitytable._elementRef.nativeElement.parentNode.scrollWidth > this.entitytable._elementRef.nativeElement.parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
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
          for (const prop in rows[index]) {
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
    // this.modalService.open('slide-in-form', this.conf.addComponent);
  }

  doEdit(id) {
    if (this.conf.doEdit) {
      this.conf.doEdit(id);
    } else {
      this.router.navigate(
        new Array('/').concat(this.conf.route_edit).concat(id));
    }
  }

  //generate delete msg
  getDeleteMessage(item, action=T("Delete ")) {
    let deleteMsg = T("Delete the selected item?");
    if (this.conf.config.deleteMsg) {
      deleteMsg = action + this.conf.config.deleteMsg.title;
      let msg_content = ' <b>' + item[this.conf.config.deleteMsg.key_props[0]];
      if (this.conf.config.deleteMsg.key_props.length > 1) {
        for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
          if (item[this.conf.config.deleteMsg.key_props[i]] !== '') {
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

  doDelete(item, action?) {
    const deleteMsg =
      this.conf.confirmDeleteDialog && this.conf.confirmDeleteDialog.isMessageComplete
        ? ''
        : this.getDeleteMessage(item, action);

    let id;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop];
    } else {
      id = item.id;
    }

    const dialog = this.conf.confirmDeleteDialog || {};
    if (dialog.buildTitle) {
      dialog.title = dialog.buildTitle(item);
    }
    if (dialog.buttonMsg) {
      dialog.button = dialog.buttonMsg(item);
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
    this.busy = this.ws.call(this.conf.wsDelete, (this.conf.wsDeleteParams? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id])).subscribe(
      (resinner) => {
        this.getData();
        this.excuteDeletion = true;
        if (this.conf.afterDelete) {
          this.conf.afterDelete();
        }
      },
      (resinner) => {
        new EntityUtils().handleWSError(this, resinner, this.dialogService);
        this.loader.close();
      }
    )
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
          (this.ws.call(this.conf.wsDelete, (this.conf.wsDeleteParams? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id]))
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

  reorderEvent(event) {
    const configuredShowActions = this.showActions;
    this.showActions = false;
    this.paginationPageIndex = 0;
    const sort = event.sorts[0],
      rows = this.currentRows;
    this.storageService.tableSorter(rows, sort.prop, sort.dir);
    this.rows = rows;
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
  }

  getMultiDeleteMessage(items) {
    let deleteMsg = "Delete the selected items?";
    if (this.conf.config.deleteMsg) {
      deleteMsg = "Delete selected " + this.conf.config.deleteMsg.title + "(s)?";
      let msg_content = "<ul>";
      for (let j = 0; j < items.length; j++) {
        let sub_msg_content;
        if (this.conf.config.deleteMsg.key_props.length > 1) {
          sub_msg_content = '<li><strong>' + items[j][this.conf.config.deleteMsg.key_props[0]] + '</strong>';
          sub_msg_content += '<ul class="nested-list">';

          for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
            if (items[j][this.conf.config.deleteMsg.key_props[i]] != '') {
              sub_msg_content += '<li>' + items[j][this.conf.config.deleteMsg.key_props[i]] + '</li>';
            }
          }
          sub_msg_content += '</ul>';
        } else {
          sub_msg_content = '<li>' + items[j][this.conf.config.deleteMsg.key_props[0]];
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
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
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
                  //this.selected = [];
                  this.selection.clear();

                  const selectedName = this.conf.wsMultiDeleteParams(selected)[1];
                  let message = "";
                  for (let i = 0; i < res1.result.length; i++) {
                    if (res1.result[i].error != null) {
                      message = message + '<li>' + selectedName[i] + ': ' + res1.result[i].error + '</li>';
                    }
                  }
                  if (message === "") {
                    this.dialogService.Info(T("Items deleted"), '', '300px', 'info', true);
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
    
  }

  // Stores currently selected columns in preference service
  selectColumnsToShowOrHide() {
    const obj = {};
    obj['title'] = this.title;
    obj['cols'] = this.conf.columns;

    const preferredCols = this.prefService.preferences.tableDisplayedColumns;
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
    if (!(this.conf.columns.length === this.originalConfColumns.length &&
        this.conf.columns.length === this.allColumns.length)) {
      this.conf.columns = this.originalConfColumns;
      
      this.selectColumnsToShowOrHide();
    }
  }

  isChecked(col:any) {
    return this.conf.columns.find(c => {
      return c.name === col.name;
    }) !== undefined;
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

  getButtonClass(prop) {
    switch(prop) {
      case 'RUNNING' : return 'fn-theme-orange';
      case 'FINISHED' : return 'fn-theme-green';
      case 'SUCCESS' : return 'fn-theme-green';
      case 'ERROR' : return 'fn-theme-red';
      case 'FAILED' : return 'fn-theme-red';
      case 'HOLD' : return 'fn-theme-yellow';
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

  runningStateButton(jobid) {
      const dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": T("Task is running") }, disableClose: false });
      dialogRef.componentInstance.jobId = jobid;
      dialogRef.componentInstance.wsshow();
      dialogRef.componentInstance.success.subscribe((res) => {
        dialogRef.close();
      });
      dialogRef.componentInstance.failure.subscribe((err) => {
        dialogRef.close();
      });
  }

  getCellClass({ row, column, value }): any {
    if (value) {
      return {
        'entity-table-cell-error': String(value).includes('*ERR*')
      };
    }
  }

  columnsToString(cols, key){
    return cols.map((c) => c[key]);
  }

  masterToggle(){
    this.isAllSelected ? this.selection.clear() : 
    this.currentRows.forEach((row) => this.selection.select(row));
  }

  getFirstKey(obj){
    return this.conf.config.multiSelect ? this.currentColumns[1].prop : this.currentColumns[0].prop;
  }

  onHover(evt, over = true){
    const row = this.findRow(evt);
    const cells = row.children;

    for(let i = 0; i < cells.length; i++){
      const cell = cells[i];
      if(cell.classList.contains('mat-table-sticky') || cell.classList.contains('threedot-column')){
        if(over){
          cell.classList.add('hover');
        } else {
          cell.classList.remove('hover');
        }
      }
    }; 
  }

  findRow(el){
    let target = el.target;
    do {
      target = target.parentElement;
    } while(target.tagName.toLowerCase() !== 'tr')
    return target;
  }

  isInteractive(column: string): boolean {
    const item = this.currentColumns.find(obj => obj.prop === column);
    return (item?.checkbox || item?.toggle || item?.button);
  }

}
