import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy, OnInit,
} from '@angular/core';
import {
  animate, state, style, transition, trigger,
} from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import * as _ from 'lodash';
import {
  fromEvent as observableFromEvent, Observable, of, Subscription,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { DialogService, JobService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ErdService } from '../../../../services/erd.service';
import { RestService } from '../../../../services/rest.service';
import { StorageService } from '../../../../services/storage.service';
import { WebSocketService } from '../../../../services/ws.service';
import { ModalService } from '../../../../services/modal.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../utils';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { EntityTableService } from './entity-table.service';
import { EntityTableRowDetailsComponent } from './entity-table-row-details/entity-table-row-details.component';
import { EntityTableAddActionsComponent } from './entity-table-add-actions.component';
import { EntityJobComponent } from '../entity-job/entity-job.component';

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';

export interface InputTableConf {
  prerequisite?: any;
  globalConfig?: any;
  columns: any[];
  columnFilter?: boolean;
  hideTopActions?: boolean;
  queryCall?: ApiMethod;
  queryCallOption?: any;
  queryCallJob?: any;
  resource_name?: string;
  route_edit?: string | string[];
  route_add?: string[];
  queryRes?: any [];
  showActions?: boolean;
  isActionVisible?: any;
  custActions?: any[];
  multiActions?: any[];
  multiActionsIconsOnly?: boolean;
  noActions?: boolean;
  config?: any;
  confirmDeleteDialog?: any;
  hasDetails?: boolean;
  rowDetailComponent?: any;
  detailRowHeight?: any;
  cardHeaderComponent?: any;
  asyncView?: boolean;
  wsDelete?: ApiMethod;
  noAdd?: boolean;
  emptyTableConfigMessages?: {
    errors?: { title: string; message: string };
    first_use?: { title: string; message: string };
    loading?: { title: string; message: string };
    no_page_data?: { title: string; message: string };
    no_search_results?: { title: string; message: string };
    buttonText?: string;
  };
  actionsConfig?: { actionType: any; actionConfig: any };
  disableActionsConfig?: boolean;
  wsDeleteParams?(row: any, id: string): any;
  addRows?(entity: EntityTableComponent): void;
  changeEvent?(entity: EntityTableComponent): void;
  preInit?(entity: EntityTableComponent): void;
  afterInit?(entity: EntityTableComponent): void;
  dataHandler?(entity: EntityTableComponent): any;
  resourceTransformIncomingRestData?(data: any): any;
  getActions?(row: any): EntityTableAction[];
  getAddActions?(): any [];
  rowValue?(row: any, attr: any): any;
  wsMultiDelete?(resp: any): any;
  wsMultiDeleteParams?(selected: any): any;
  updateMultiAction?(selected: any): any;
  doAdd?(): void;
  doEdit?(id?: any): void;
  onCheckboxChange?(row: any): any;
  onSliderChange?(row: any): any;
  callGetFunction?(entity: EntityTableComponent): any;
  prerequisiteFailedHandler?(entity: EntityTableComponent): void;
  afterDelete?(): void;
  addComponent?: any;
  editComponent?: any;
  onRowClick?(row: any): any;
}

export interface EntityTableAction {
  id: string | number;
  // TODO: Either name or actionName may be unnecessary
  name: string;
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
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EntityTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() conf: InputTableConf;

  @ViewChild('defaultMultiActions', { static: false }) defaultMultiActions: ElementRef;
  @ViewChild('newEntityTable', { static: false }) entitytable: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;

  scrollContainer: HTMLElement;
  scrolledIndex = 0;
  tableMouseEvent: MouseEvent;
  // MdPaginator Inputs
  paginationPageSize = 10;
  paginationPageSizeOptions: number[] = [5, 10, 25, 100];
  paginationPageIndex = 0;
  paginationShowFirstLastButtons = true;
  hideTopActions = false;
  displayedColumns: string[] = [];
  firstUse = true;
  emptyTableConf: EmptyConfig = {
    type: EmptyType.loading,
    large: true,
    title: this.title,
  };
  isTableEmpty = true;
  selection = new SelectionModel<any>(true, []);
  busy: Subscription;
  columns: any[] = [];
  rowHeight = 50;
  zoomLevel: number;
  tableHeight: number = (this.paginationPageSize * this.rowHeight) + 100;
  fixedTableHight = false;
  cardHeaderComponentHight = 0;
  windowHeight: number;

  allColumns: any[] = []; // Need this for the checkbox headings
  columnFilter = true; // show the column filters by default
  filterColumns: any[] = []; // ...for the filter function - becomes THE complete list of all columns, diplayed or not
  alwaysDisplayedCols: any[] = []; // For cols the user can't turn off
  anythingClicked = false; // stores a pristine/touched state for checkboxes
  originalConfColumns: any[] = []; // The 'factory setting
  colMaxWidths: any[] = [];

  startingHeight: number;
  expandedRows = document.querySelectorAll('.expanded-row').length;
  expandedElement: any | null = null;

  dataSource: MatTableDataSource<any>;
  rows: any[] = [];
  currentRows: any[] = []; // Rows applying filter
  seenRows: any[] = [];
  getFunction: any;
  config: TableConfig = {
    paging: true,
    sorting: { columns: this.columns },
  };
  asyncView = false; // default table view is not async
  showDefaults = false;
  showSpinner = false;
  cardHeaderReady = false;
  showActions = true;
  entityTableRowDetailsComponent = EntityTableRowDetailsComponent;
  removeFromSelectedTotal = 0;
  hasActions = true;
  sortKey: string;
  filterValue = ''; // the filter string filled in search input.
  readonly EntityJobState = EntityJobState;
  // Global Actions in Page Title
  protected actionsConfig: any;
  protected loaderOpen = false;
  protected toDeleteRow: any;
  private interval: any;
  private excuteDeletion = false;
  private needRefreshTable = false;
  private needTableResize = true;
  private routeSub: any;
  private _multiActionsIconsOnly = false;

  get multiActionsIconsOnly() {
    return this._multiActionsIconsOnly;
  }

  set multiActionsIconsOnly(value: boolean) {
    this._multiActionsIconsOnly = value;
  }

  get currentColumns(): any[] {
    const result = this.alwaysDisplayedCols.concat(this.conf.columns);

    // Actions without expansion
    if (this.hasActions && result[result.length - 1] !== 'action' && (this.hasDetails() === false || !this.hasDetails)) {
      result.push({ prop: 'action' });
    }

    // Expansion
    if (this.hasDetails() === true) {
      result.push({ prop: 'expansion-chevrons' });
    }

    if (this.conf.config.multiSelect) {
      result.unshift({ prop: 'multiselect' });
    }

    return result;
  }

  hasDetails = () =>
    this.conf.rowDetailComponent || (this.allColumns.length > 0 && this.conf.columns.length !== this.allColumns.length);

  getRowDetailHeight = () =>
    (this.hasDetails() && !this.conf.rowDetailComponent
      ? (this.allColumns.length - this.conf.columns.length) * DETAIL_HEIGHT + 76 // add space for padding
      : this.conf.detailRowHeight || 100);

  get isAllSelected() {
    return this.selection.selected.length === this.currentRows.length;
  }

  constructor(protected core: CoreService, protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected erdService: ErdService, protected translate: TranslateService,
    public storageService: StorageService, protected job: JobService, protected prefService: PreferencesService,
    protected matDialog: MatDialog, public modalService: ModalService, public tableService: EntityTableService) {
    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).subscribe((evt: CoreEvent) => {
      this.multiActionsIconsOnly = evt.data.preferIconsOnly;
    });
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
    // watch for navigation events as ngOnDestroy doesn't always trigger on these
    this.routeSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.cleanup();
      }
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  cleanup() {
    this.core.unregister({ observerClass: this });
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (!this.routeSub.closed) {
      this.routeSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.actionsConfig = { actionType: EntityTableAddActionsComponent, actionConfig: this };
    this.cardHeaderReady = !this.conf.cardHeaderComponent;
    this.hasActions = this.conf.noActions !== true;
    if (this.conf.config?.pagingOptions?.pageSize) {
      this.paginationPageSize = this.conf.config.pagingOptions.pageSize;
    }
    if (this.conf.config?.pagingOptions?.pageSizeOptions) {
      this.paginationPageSizeOptions = this.conf.config.pagingOptions.pageSizeOptions;
    }

    this.sortKey = (this.conf.config.deleteMsg && this.conf.config.deleteMsg.key_props) ? this.conf.config.deleteMsg.key_props[0] : this.conf.columns[0].prop;
    setTimeout(async () => {
      if (this.conf.prerequisite) {
        await this.conf.prerequisite().then(
          (res: any) => {
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
          },
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
    });
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
    this.showActions = this.conf.showActions === undefined ? true : this.conf.showActions;
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
        preferredCols.forEach((i: any) => {
          // If preferred columns have been set for THIS table...
          if (i.title === this.title) {
            this.firstUse = false;
            this.conf.columns = i.cols.filter((col: any) =>
              // Remove columns if they are already present in always displayed columns
              !this.alwaysDisplayedCols.find((item) => item.prop === col.prop));
            // Remove columns from display and preferred cols if they don't exist in the table
            const notFound: any[] = [];
            this.conf.columns.forEach((col) => {
              const found = this.filterColumns.find((o) => o.prop === col.prop);
              if (!found) {
                notFound.push(col.prop);
              }
            });
            this.conf.columns = this.conf.columns.filter((col) => !notFound.includes(col.prop));
            this.selectColumnsToShowOrHide();
          }
        });
        if (this.title === 'Users') {
          // Makes a list of the table's column maxWidths
          this.filterColumns.forEach((column) => {
            const tempObj: any = {};
            tempObj['name'] = column.name;
            tempObj['maxWidth'] = column.maxWidth;
            this.colMaxWidths.push(tempObj);
          });
          this.conf.columns = this.dropLastMaxWidth();
        }
      }
      if (this.firstUse) {
        this.selectColumnsToShowOrHide();
      }
    }, this.prefService.preferences.tableDisplayedColumns.length === 0 ? 200 : 0);

    this.displayedColumns.push('action');
    if (this.conf.changeEvent) {
      this.conf.changeEvent(this);
    }

    if (typeof (this.conf.hideTopActions) !== 'undefined') {
      this.hideTopActions = this.conf.hideTopActions;
    }

    // Delay spinner 500ms so it won't show up on a fast-loading page
    setTimeout(() => { this.setShowSpinner(); }, 500);

    // End of layout section ------------
  }

  ngAfterViewInit() {
    // If actionsConfig was disabled, don't show the default toolbar. like the Table is in a Tab.
    if (!this.conf.disableActionsConfig) {
      // Setup Actions in Page Title Component
      this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
    }
  }

  // Filter the table by the filter string.
  filter(filterValue: string) {
    this.filterValue = filterValue;
    if (filterValue.length > 0) {
      this.dataSource.filter = filterValue;
    } else {
      this.dataSource.filter = '';
    }

    if (this.dataSource.filteredData && this.dataSource.filteredData.length) {
      this.isTableEmpty = false;
    } else {
      this.isTableEmpty = true;
      this.configureEmptyTable(this.dataSource.filter ? EmptyType.no_search_results : this.firstUse ? EmptyType.first_use : EmptyType.no_page_data);
    }

    if (this.dataSource.paginator && this.conf.config.paging) {
      this.dataSource.paginator.firstPage();
    }
  }

  configureEmptyTable(emptyType: EmptyType, error: any = null) {
    if (!emptyType) {
      return;
    }
    let title = '';
    let message = '';
    let messagePreset = false;
    switch (emptyType) {
      case EmptyType.loading:
        this.emptyTableConf = {
          type: EmptyType.loading,
          large: true,
          title: this.title,
        };
        break;

      case EmptyType.no_search_results:
        title = T('No Search Results.');
        message = T('Your query didn\'t return any results. Please try again.');
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.no_search_results) {
          title = this.conf.emptyTableConfigMessages.no_search_results.title;
          message = this.conf.emptyTableConfigMessages.no_search_results.message;
        }
        this.emptyTableConf = {
          type: EmptyType.no_search_results,
          large: true,
          title,
          message,
        };
        break;

      case EmptyType.errors:
        title = T('Something went wrong');
        message = T('The system returned the following error - ');
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.errors) {
          title = this.conf.emptyTableConfigMessages.errors.title;
          message = this.conf.emptyTableConfigMessages.errors.message;
        }
        this.emptyTableConf = {
          title,
          message: message + error,
          large: true,
          type: EmptyType.errors,
        };
        break;

      case EmptyType.first_use:
        messagePreset = false;
        title = T('No ') + this.title;
        message = T('It seems you haven\'t setup any ') + this.title + T(' yet.');
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.first_use) {
          title = this.conf.emptyTableConfigMessages.first_use.title;
          message = this.conf.emptyTableConfigMessages.first_use.message;
          messagePreset = true;
        }
        this.emptyTableConf = {
          type: EmptyType.first_use,
          large: true,
          title,
          message,
        };
        if (!this.conf.noAdd) {
          if (!messagePreset) {
            this.emptyTableConf['message'] += T(' Please click the button below to add ') + this.title + T('.');
          }
          let buttonText = T('Add ') + this.title;
          if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.buttonText) {
            buttonText = this.conf.emptyTableConfigMessages.buttonText;
          }
          this.emptyTableConf['button'] = {
            label: buttonText,
            action: this.doAdd.bind(this),
          };
        }
        break;

      case EmptyType.no_page_data:
      default:
        messagePreset = false;
        title = T('No ') + this.title;
        message = T('The system could not retrieve any ') + this.title + T(' from the database.');
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.no_page_data) {
          title = this.conf.emptyTableConfigMessages.no_page_data.title;
          message = this.conf.emptyTableConfigMessages.no_page_data.message;
          messagePreset = true;
        }
        this.emptyTableConf = {
          type: EmptyType.no_page_data,
          large: true,
          title,
          message,
        };
        if (!this.conf.noAdd) {
          if (!messagePreset) {
            this.emptyTableConf['message'] += T(' Please click the button below to add ') + this.title + T('.');
          }
          let buttonText = T('Add ') + this.title;
          if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.buttonText) {
            buttonText = this.conf.emptyTableConfigMessages.buttonText;
          }
          this.emptyTableConf['button'] = {
            label: buttonText,
            action: this.doAdd.bind(this),
          };
        }
        break;
    }
  }

  dropLastMaxWidth() {
    // Reset all column maxWidths
    this.conf.columns.forEach((column) => {
      if (this.colMaxWidths.length > 0) {
        column['maxWidth'] = (this.colMaxWidths.find(({ name }) => name === column.name)).maxWidth;
      }
    });
    // Delete maXwidth on last col displayed (prevents a display glitch)
    if (this.conf.columns.length > 0) {
      delete (this.conf.columns[Object.keys(this.conf.columns).length - 1]).maxWidth;
    }
    return this.conf.columns;
  }

  setShowSpinner() {
    this.showSpinner = true;
  }

  getData() {
    const sort: String[] = [];
    let options: any = {};

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
      } else if (this.conf.queryCallOption) {
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
          this.callGetFunction(true);
        }
      }, 10000);
    }
  }

  callGetFunction(skipActions = false) {
    this.getFunction.subscribe(
      (res: any) => {
        this.handleData(res, skipActions);
      },
      (res: any) => {
        this.isTableEmpty = true;
        this.configureEmptyTable(EmptyType.errors, res);
        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (res.hasOwnProperty('reason') && (res.hasOwnProperty('trace') && res.hasOwnProperty('type'))) {
          this.dialogService.errorReport(res.type || res.trace.class, res.reason, res.trace.formatted);
        } else {
          new EntityUtils().handleError(this, res);
        }
      },
    );
  }

  handleData(res: any, skipActions = false): any {
    this.expandedRows = document.querySelectorAll('.expanded-row').length;
    const cache = this.expandedElement;
    this.expandedElement = this.expandedRows > 0 ? cache : null;

    if (typeof (res) === 'undefined' || typeof (res.data) === 'undefined') {
      res = {
        data: res,
      };
    }

    if (res.data) {
      if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
        res.data = this.conf.resourceTransformIncomingRestData(res.data);
        for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
          if (res.data.length > 0 && res.data[0].hasOwnProperty(prop) && typeof res.data[0][prop] === 'string') {
            res.data.map((row: any) => row[prop] = new EntityUtils().parseDOW(row[prop]));
          }
        }
      }
    } else if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
      res = this.conf.resourceTransformIncomingRestData(res);
      for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
        if (res.length > 0 && res[0].hasOwnProperty(prop) && typeof res[0][prop] === 'string') {
          res.map((row: any) => row[prop] = new EntityUtils().parseDOW(row[prop]));
        }
      }
    }

    this.rows = this.generateRows(res);
    if (!skipActions) {
      this.storageService.tableSorter(this.rows, this.sortKey, 'asc');
    }
    if (this.conf.dataHandler) {
      this.conf.dataHandler(this);
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }
    if (!this.showDefaults) {
      this.currentRows = this.filterValue === '' ? this.rows : this.currentRows;
      this.paginationPageIndex = 0;
      this.showDefaults = true;
    }
    if ((this.expandedRows === 0 || !this.asyncView || this.excuteDeletion || this.needRefreshTable) && this.filterValue === '') {
      this.excuteDeletion = false;
      this.needRefreshTable = false;

      this.needTableResize = true;
      this.currentRows = this.rows;
      this.paginationPageIndex = 0;
    }

    if (this.currentRows && this.currentRows.length > 0) {
      this.isTableEmpty = false;
    } else {
      this.isTableEmpty = true;
      this.configureEmptyTable(this.firstUse ? EmptyType.first_use : EmptyType.no_page_data);
    }

    this.dataSource = new MatTableDataSource(this.currentRows);
    this.dataSource.sort = this.sort;

    this.filter(this.filterValue);

    if (this.conf.config.paging) {
      // On first load, paginator is not rendered because table is empty, so we force render here so that we can get valid paginator instance
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      }, 0);
    }

    return res;
  }

  isLeftStickyColumnNo(i: number) {
    return i === (this.currentColumns[0].prop === 'multiselect' ? 1 : 0);
  }

  shouldApplyStickyOffset(i: number) {
    return this.currentColumns[0].prop === 'multiselect' && i === 1;
  }

  isTableOverflow() {
    let hasHorizontalScrollbar = false;
    if (this.entitytable) {
      hasHorizontalScrollbar = this.entitytable._elementRef.nativeElement.parentNode.scrollWidth > this.entitytable._elementRef.nativeElement.parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
  }

  generateRows(res: any): any[] {
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
        const index = _.findIndex(rows, { id: this.currentRows[i].id });
        if (index > -1) {
          for (const prop in rows[index]) {
            this.currentRows[i][prop] = rows[index][prop];
          }
        }
      }

      const newRows = [];
      for (let i = 0; i < this.rows.length; i++) {
        const index = _.findIndex(rows, { id: this.rows[i].id });
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

  trClass(row: any) {
    const classes = [];

    classes.push('treegrid-' + row.id);
    if (row._parent) {
      classes.push('treegrid-parent-' + row._parent);
    }

    return classes.join(' ');
  }

  getActions(row: any) {
    if (this.conf.getActions) {
      return this.conf.getActions(row);
    }
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: T('Edit'),
      onClick: (rowinner: any) => { this.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: T('Delete'),
      onClick: (rowinner: any) => { this.doDelete(rowinner); },
    }];
  }

  getAddActions() {
    if (this.conf.getAddActions) {
      return this.conf.getAddActions();
    }
    return [];
  }

  rowValue(row: any, attr: string) {
    if (this.conf.rowValue) {
      try {
        return this.conf.rowValue(row, attr);
      } catch (e) {
        return row[attr];
      }
    }

    return row[attr];
  }

  convertDisplayValue(value: any) {
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

  doEdit(id: string) {
    if (this.conf.doEdit) {
      this.conf.doEdit(id);
    } else {
      this.router.navigate(
        new Array('/').concat(this.conf.route_edit).concat(id),
      );
    }
  }

  // generate delete msg
  getDeleteMessage(item: any, action = T('Delete ')) {
    let deleteMsg = T('Delete the selected item?');
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
      msg_content += '</b>?';
      deleteMsg += msg_content;
    }
    this.translate.get(deleteMsg).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doDelete(item: any, action?: any) {
    const deleteMsg = this.conf.confirmDeleteDialog && this.conf.confirmDeleteDialog.isMessageComplete
      ? ''
      : this.getDeleteMessage(item, action);

    let id: string;
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
      this.conf.config.deleteMsg.doubleConfirm(item).subscribe((doubleConfirmDialog: boolean) => {
        if (doubleConfirmDialog) {
          this.toDeleteRow = item;
          this.delete(id);
        }
      });
    } else {
      this.dialogService.confirm(
        dialog.hasOwnProperty('title') ? dialog['title'] : T('Delete'),
        dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        dialog.hasOwnProperty('button') ? dialog['button'] : T('Delete'),
      ).subscribe((res: boolean) => {
        if (res) {
          this.toDeleteRow = item;
          this.delete(id);
        }
      });
    }
  }

  delete(id: string) {
    this.loader.open();
    this.loaderOpen = true;
    const data = {};
    this.busy = this.ws.call(this.conf.wsDelete, (this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id])).subscribe(
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
      },
    );
  }

  doDeleteJob(item: any): Observable<{ state: EntityJobState } | false> {
    const deleteMsg = this.getDeleteMessage(item);
    let id: string;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop];
    } else {
      id = item.id;
    }
    let dialog: any = {};
    if (this.conf.confirmDeleteDialog) {
      dialog = this.conf.confirmDeleteDialog;
    }

    return this.dialogService
      .confirm(
        dialog.hasOwnProperty('title') ? dialog['title'] : T('Delete'),
        dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        dialog.hasOwnProperty('button') ? dialog['button'] : T('Delete'),
      )
      .pipe(
        filter((ok) => !!ok),
        tap(() => {
          this.loader.open();
          this.loaderOpen = true;
        }),
        switchMap(() =>
          (this.ws.call(this.conf.wsDelete, (this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id]))
          ).pipe(
            take(1),
            catchError((error) => {
              new EntityUtils().handleWSError(this, error, this.dialogService);
              this.loader.close();
              return of(false);
            }),
          )),
        switchMap((jobId: string) => (jobId ? this.job.getJobStatus(jobId) : of(false))),
      );
  }

  reorderEvent(event: any) {
    const configuredShowActions = this.showActions;
    this.showActions = false;
    this.paginationPageIndex = 0;
    const sort = event.sorts[0];
    const rows = this.currentRows;
    this.storageService.tableSorter(rows, sort.prop, sort.dir);
    this.rows = rows;
    setTimeout(() => {
      this.showActions = configuredShowActions;
    }, 50);
  }

  /**
   * some structure... should be the same as the other rows.
   * which are field maps.
   *
   * this method can be called to externally push rows on to the tables.
   *
   * @param param0
   */
  pushNewRow(row: any) {
    this.rows.push(row);
    this.currentRows = this.rows;
  }

  getMultiDeleteMessage(items: any) {
    let deleteMsg = 'Delete the selected items?';
    if (this.conf.config.deleteMsg) {
      deleteMsg = 'Delete selected ' + this.conf.config.deleteMsg.title + '(s)?';
      let msg_content = '<ul>';
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

        sub_msg_content += '</li>';
        msg_content += sub_msg_content;
      }
      msg_content += '</ul>';
      deleteMsg += msg_content;
    }
    this.translate.get(deleteMsg).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doMultiDelete(selected: any) {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm('Delete', multiDeleteMsg, false, T('Delete')).subscribe((res: boolean) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        if (this.conf.wsMultiDelete) {
          // ws to do multi-delete
          if (this.conf.wsMultiDeleteParams) {
            this.busy = this.ws.job(this.conf.wsMultiDelete, this.conf.wsMultiDeleteParams(selected)).subscribe(
              (res1) => {
                if (res1.state === EntityJobState.Success) {
                  this.loader.close();
                  this.loaderOpen = false;
                  this.getData();
                  // this.selected = [];
                  this.selection.clear();

                  const selectedName = this.conf.wsMultiDeleteParams(selected)[1];
                  let message = '';
                  for (let i = 0; i < res1.result.length; i++) {
                    if (res1.result[i].error != null) {
                      message = message + '<li>' + selectedName[i] + ': ' + res1.result[i].error + '</li>';
                    }
                  }
                  if (message === '') {
                    this.dialogService.Info(T('Items deleted'), '', '300px', 'info', true);
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
              },
            );
          }
        } else {
          // rest to do multi-delete
        }
      }
    });
  }

  // Next section operates the checkboxes to show/hide columns
  toggle(col: any) {
    const isChecked = this.isChecked(col);
    this.anythingClicked = true;

    if (isChecked) {
      this.conf.columns = this.conf.columns.filter((c) => c.name !== col.name);
    } else {
      this.conf.columns = [...this.conf.columns, col];
    }
    this.selectColumnsToShowOrHide();
  }

  // Stores currently selected columns in preference service
  selectColumnsToShowOrHide() {
    const obj: any = {};
    obj['title'] = this.title;
    obj['cols'] = this.conf.columns;

    const preferredCols = this.prefService.preferences.tableDisplayedColumns;
    if (preferredCols.length > 0) {
      preferredCols.forEach((i: any) => {
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
    if (!(this.conf.columns.length === this.originalConfColumns.length
        && this.conf.columns.length === this.allColumns.length)) {
      this.conf.columns = this.originalConfColumns;

      this.selectColumnsToShowOrHide();
    }
  }

  isChecked(col: any) {
    return this.conf.columns.find((c) => c.name === col.name) !== undefined;
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

    return this.conf.columns;
  }

  // Used by the select all checkbox to determine whether it should be checked
  checkLength() {
    if (this.allColumns && this.conf.columns) {
      return this.conf.columns.length === this.allColumns.length;
    }
  }
  // End checkbox section -----------------------

  toggleLabels() {
    this.multiActionsIconsOnly = !this.multiActionsIconsOnly;
  }

  getButtonClass(state: EntityJobState): string {
    switch (state) {
      case EntityJobState.Pending: return 'fn-theme-orange';
      case EntityJobState.Running: return 'fn-theme-orange';
      case EntityJobState.Aborted: return 'fn-theme-orange';
      case EntityJobState.Finished: return 'fn-theme-green';
      case EntityJobState.Success: return 'fn-theme-green';
      case EntityJobState.Error: return 'fn-theme-red';
      case EntityJobState.Failed: return 'fn-theme-red';
      case EntityJobState.Hold: return 'fn-theme-yellow';
      default: return 'fn-theme-primary';
    }
  }

  stateClickable(value: any, colConfig: any) {
    if (colConfig.infoStates) {
      return _.indexOf(colConfig.infoStates, value) < 0;
    }
    return value !== EntityJobState.Pending;
  }

  runningStateButton(jobid: number) {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Task is running') }, disableClose: false });
    dialogRef.componentInstance.jobId = jobid;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.failure.subscribe(() => {
      dialogRef.close();
    });
  }

  getCellClass({ row, column, value }: any): any {
    if (value) {
      return {
        'entity-table-cell-error': String(value).includes('*ERR*'),
      };
    }
  }

  columnsToString(cols: any, key: any) {
    return cols.map((c: any) => c[key]);
  }

  masterToggle() {
    this.isAllSelected ? this.selection.clear()
      : this.currentRows.forEach((row) => this.selection.select(row));
  }

  getFirstKey() {
    return this.conf.config.multiSelect ? this.currentColumns[1].prop : this.currentColumns[0].prop;
  }

  onHover(evt: MouseEvent, over = true) {
    const row = this.findRow(evt);
    const cells = row.children;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.classList.contains('mat-table-sticky') || cell.classList.contains('threedot-column')) {
        if (over) {
          cell.classList.add('hover');
        } else {
          cell.classList.remove('hover');
        }
      }
    }
  }

  findRow(el: any) {
    let target = el.target;
    do {
      target = target.parentElement;
    } while (target.tagName.toLowerCase() !== 'tr');
    return target;
  }

  isInteractive(column: string): boolean {
    const item = this.currentColumns.find((obj) => obj.prop === column);
    return (item?.checkbox || item?.toggle || item?.button);
  }

  doRowClick(element: any) {
    if (this.conf.onRowClick) {
      this.conf.onRowClick(element);
    } else {
      this.expandedElement = this.expandedElement === element ? null : element;
    }
  }
}
