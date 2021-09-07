import {
  animate, state, style, transition, trigger,
} from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewChecked, Component, Input, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  Observable, of, Subscription, EMPTY,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { JobState } from 'app/enums/job-state.enum';
import { UserPreferencesChangedEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { GlobalActionConfig } from 'app/interfaces/global-action.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { EntityTableAddActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-add-actions/entity-table-add-actions.component';
import {
  EntityTableAction,
  EntityTableColumn, EntityTableColumnProp,
  EntityTableConfig, EntityTableConfigConfig, EntityTableConfirmDialog,
} from 'app/pages/common/entity/entity-table/entity-table.interface';
import { DialogService, JobService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';
import { EmptyConfig, EmptyType } from '../entity-empty/entity-empty.component';
import { EntityJobComponent } from '../entity-job/entity-job.component';
import { EntityUtils } from '../utils';

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: any;
  options?: any[]; // Function parameters
}

@UntilDestroy()
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
export class EntityTableComponent<Row = any> implements OnInit, AfterViewChecked, OnDestroy {
  @Input() title = '';
  @Input() conf: EntityTableConfig;

  @ViewChild('newEntityTable', { static: false }) entitytable: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // MdPaginator Inputs
  paginationPageSize = 10;
  paginationPageSizeOptions: number[] = [5, 10, 25, 100];
  paginationPageIndex = 0;
  paginationShowFirstLastButtons = true;
  hideTopActions = false;
  displayedColumns: string[] = [];
  firstUse = true;
  emptyTableConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: this.title,
  };
  isTableEmpty = true;
  selection = new SelectionModel<any>(true, []);
  busy: Subscription;
  columns: any[] = [];

  /**
   * Need this for the checkbox headings
   */
  allColumns: EntityTableColumn[] = [];

  /**
   * Show the column filters by default
   */
  columnFilter = true;

  /**
   * ...for the filter function - becomes THE complete list of all columns, diplayed or not
   */
  filterColumns: EntityTableColumn[] = [];

  /**
   * For cols the user can't turn off.
   */
  alwaysDisplayedCols: EntityTableColumn[] = [];

  /**
   * Stores a pristine/touched state for checkboxes
   */
  anythingClicked = false;

  /**
   * The factory setting.
   */
  originalConfColumns: EntityTableColumn[] = [];
  colMaxWidths: { name: string; maxWidth: number }[] = [];

  expandedRows = document.querySelectorAll('.expanded-row').length;
  expandedElement: Row | null = null;

  dataSource: MatTableDataSource<any>;
  rows: Row[] = [];
  currentRows: any[] = []; // Rows applying filter
  getFunction: Observable<any>;
  config: EntityTableConfigConfig = {
    paging: true,
    sorting: { columns: this.columns },
  };
  asyncView = false; // default table view is not async
  showDefaults = false;
  showSpinner = false;
  cardHeaderReady = false;
  showActions = true;
  hasActions = true;
  sortKey: keyof Row;
  filterValue = ''; // the filter string filled in search input.
  readonly EntityJobState = JobState;
  // Global Actions in Page Title
  protected actionsConfig: GlobalActionConfig;
  loaderOpen = false;
  protected toDeleteRow: Row;
  private interval: Interval;
  excuteDeletion = false;
  needRefreshTable = false;
  private routeSub: Subscription;
  multiActionsIconsOnly = false;

  get currentColumns(): EntityTableColumn[] {
    const result = this.alwaysDisplayedCols.concat(this.conf.columns) as any;

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

  hasDetails = (): boolean => {
    return Boolean(this.conf.rowDetailComponent)
      || (this.allColumns.length > 0 && this.conf.columns.length !== this.allColumns.length);
  };

  isAllSelected = false;
  globalActionsInit = false;

  constructor(
    protected core: CoreService,
    protected router: Router,
    public ws: WebSocketService,
    public dialogService: DialogService,
    public loader: AppLoaderService,
    protected translate: TranslateService,
    public storageService: StorageService,
    protected job: JobService,
    protected prefService: PreferencesService,
    protected matDialog: MatDialog,
    public modalService: ModalService,
  ) {
    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.multiActionsIconsOnly = evt.data.preferIconsOnly;
    });
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
    // watch for navigation events as ngOnDestroy doesn't always trigger on these
    this.routeSub = this.router.events.pipe(untilDestroyed(this)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.cleanup();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  cleanup(): void {
    this.core.unregister({ observerClass: this });
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (!this.routeSub.closed) {
      this.routeSub.unsubscribe();
    }
  }

  pageChanged(): void {
    this.selection.clear();
  }

  get currentRowsThatAreOnScreenToo(): any[] {
    let currentlyShowingRows = [...this.dataSource.filteredData];
    if (this.dataSource.paginator) {
      const start = this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize;
      const rowsCount = currentlyShowingRows.length < start + this.dataSource.paginator.pageSize
        ? currentlyShowingRows.length - start : this.dataSource.paginator.pageSize;
      currentlyShowingRows = currentlyShowingRows.splice(start, rowsCount);
    }
    const showingRows = currentlyShowingRows;
    return this.currentRows.filter((row) => {
      const index = showingRows.findIndex((showingRow: any) => {
        return showingRow['multiselect_id'] === row['multiselect_id'];
      });
      return index >= 0;
    });
  }

  toggleSelection(element: any): void {
    this.selection.toggle(element);

    const allShown = this.currentRowsThatAreOnScreenToo;
    for (const row of allShown) {
      if (!this.selection.isSelected(row)) {
        this.isAllSelected = false;
        return;
      }
    }
    this.isAllSelected = true;
  }

  ngOnInit(): void {
    this.actionsConfig = { actionType: EntityTableAddActionsComponent, actionConfig: this };
    this.cardHeaderReady = !this.conf.cardHeaderComponent;
    this.hasActions = this.conf.noActions !== true;
    if (this.conf.config?.pagingOptions?.pageSize) {
      this.paginationPageSize = this.conf.config.pagingOptions.pageSize;
    }
    if (this.conf.config?.pagingOptions?.pageSizeOptions) {
      this.paginationPageSizeOptions = this.conf.config.pagingOptions.pageSizeOptions;
    }

    this.sortKey = (this.conf.config.deleteMsg && this.conf.config.deleteMsg.key_props)
      ? this.conf.config.deleteMsg.key_props[0] as keyof Row
      : this.conf.columns[0].prop as keyof Row;
    setTimeout(async () => {
      if (this.conf.prerequisite) {
        await this.conf.prerequisite().then(
          (canContinue) => {
            if (canContinue) {
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

    this.conf.columns.forEach((column) => {
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
        preferredCols.forEach((column) => {
          // If preferred columns have been set for THIS table...
          if (column.title === this.title) {
            this.firstUse = false;
            this.conf.columns = column.cols.filter((col) =>
              // Remove columns if they are already present in always displayed columns
              !this.alwaysDisplayedCols.find((item) => item.prop === col.prop));
            // Remove columns from display and preferred cols if they don't exist in the table
            const notFound: EntityTableColumnProp[] = [];
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
  }

  ngAfterViewChecked(): void {
    // If actionsConfig was disabled, don't show the default toolbar. like the Table is in a Tab.
    if (!this.conf.disableActionsConfig && !this.globalActionsInit) {
      // Setup Actions in Page Title Component
      this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
      this.globalActionsInit = true;
    }
  }

  // Filter the table by the filter string.
  filter(filterValue: string): void {
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
      this.configureEmptyTable(
        this.dataSource.filter
          ? EmptyType.NoSearchResults
          : this.firstUse
            ? EmptyType.FirstUse
            : EmptyType.NoPageData,
      );
    }

    if (this.dataSource.paginator && this.conf.config.paging) {
      this.dataSource.paginator.firstPage();
    }
    this.isAllSelected = false;
    this.selection.clear();
  }

  configureEmptyTable(emptyType: EmptyType, error: any = null): void {
    if (!emptyType) {
      return;
    }
    let title = '';
    let message = '';
    let messagePreset = false;
    switch (emptyType) {
      case EmptyType.Loading:
        this.emptyTableConf = {
          type: EmptyType.Loading,
          large: true,
          title: this.title,
        };
        break;

      case EmptyType.NoSearchResults:
        title = T('No Search Results.');
        message = T('Your query didn\'t return any results. Please try again.');
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.no_search_results) {
          title = this.conf.emptyTableConfigMessages.no_search_results.title;
          message = this.conf.emptyTableConfigMessages.no_search_results.message;
        }
        this.emptyTableConf = {
          type: EmptyType.NoSearchResults,
          large: true,
          title,
          message,
        };
        break;

      case EmptyType.Errors:
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
          type: EmptyType.Errors,
        };
        break;

      case EmptyType.FirstUse:
        messagePreset = false;
        title = this.translate.instant('No {item}', { item: this.title });
        message = this.translate.instant("It seems you haven't setup any {item} yet.", { item: this.title });
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.first_use) {
          title = this.conf.emptyTableConfigMessages.first_use.title;
          message = this.conf.emptyTableConfigMessages.first_use.message;
          messagePreset = true;
        }
        this.emptyTableConf = {
          type: EmptyType.FirstUse,
          large: true,
          title,
          message,
        };
        if (!this.conf.noAdd) {
          if (!messagePreset) {
            this.emptyTableConf['message'] += this.translate.instant(' Please click the button below to add {item}.', {
              item: this.title,
            });
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

      case EmptyType.NoPageData:
      default:
        messagePreset = false;
        title = this.translate.instant('No {item}', { item: this.title });
        message = this.translate.instant('The system could not retrieve any {item} from the database.', { item: this.title });
        if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.no_page_data) {
          title = this.conf.emptyTableConfigMessages.no_page_data.title;
          message = this.conf.emptyTableConfigMessages.no_page_data.message;
          messagePreset = true;
        }
        this.emptyTableConf = {
          type: EmptyType.NoPageData,
          large: true,
          title,
          message,
        };
        if (!this.conf.noAdd) {
          if (!messagePreset) {
            this.emptyTableConf['message'] += this.translate.instant(' Please click the button below to add {item}.', {
              item: this.title,
            });
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

  dropLastMaxWidth(): EntityTableColumn[] {
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

  setShowSpinner(): void {
    this.showSpinner = true;
  }

  getData(): void {
    const sort: string[] = [];

    for (const i in this.config.sorting.columns) {
      const col = this.config.sorting.columns[i];
      if (col.sort === 'asc') {
        sort.push(col.name);
      } else if (col.sort === 'desc') {
        sort.push('-' + col.name);
      }
    }

    const options: any = { limit: 0 };
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
      this.getFunction = EMPTY;
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

  callGetFunction(skipActions = false): void {
    this.getFunction.pipe(untilDestroyed(this)).subscribe(
      (res: any) => {
        this.handleData(res, skipActions);
      },
      (res: any) => {
        this.isTableEmpty = true;
        this.configureEmptyTable(EmptyType.Errors, res);
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

      this.currentRows = this.rows;
      this.paginationPageIndex = 0;
    }

    if (this.currentRows && this.currentRows.length > 0) {
      this.isTableEmpty = false;
    } else {
      this.isTableEmpty = true;
      this.configureEmptyTable(this.firstUse ? EmptyType.FirstUse : EmptyType.NoPageData);
    }

    for (let i = 0; i < this.currentRows.length; i++) {
      this.currentRows[i].multiselect_id = i;
    }
    this.dataSource = new MatTableDataSource(this.currentRows);
    this.dataSource.sort = this.sort;

    this.filter(this.filterValue);

    if (this.conf.config.paging) {
      // On first load, paginator is not rendered because table is empty,
      // so we force render here so that we can get valid paginator instance
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      }, 0);
    }

    return res;
  }

  isLeftStickyColumnNo(i: number): boolean {
    return i === (this.currentColumns[0].prop === 'multiselect' ? 1 : 0);
  }

  shouldApplyStickyOffset(i: number): boolean {
    return this.currentColumns[0].prop === 'multiselect' && i === 1;
  }

  isTableOverflow(): boolean {
    let hasHorizontalScrollbar = false;
    if (this.entitytable) {
      const parentNode = this.entitytable._elementRef.nativeElement.parentNode;
      hasHorizontalScrollbar = parentNode.scrollWidth > parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
  }

  generateRows(res: any): any[] {
    let rows: any[];
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
        const index = _.findIndex(rows, { id: (this.rows[i] as any).id });
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

  getActions(row: Row): EntityTableAction[] {
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
    }] as EntityTableAction[];
  }

  getAddActions(): EntityTableAction[] {
    if (this.conf.getAddActions) {
      return this.conf.getAddActions();
    }
    return [];
  }

  rowValue(row: any, attr: string): any {
    if (this.conf.rowValue) {
      try {
        return this.conf.rowValue(row, attr);
      } catch (e) {
        return row[attr];
      }
    }

    return row[attr];
  }

  doAdd(): void {
    if (this.conf.doAdd) {
      this.conf.doAdd(null, this);
    } else {
      this.router.navigate(new Array('/').concat(this.conf.route_add));
    }
    // this.modalService.open('slide-in-form', this.conf.addComponent);
  }

  doEdit(id: string | number): void {
    if (this.conf.doEdit) {
      this.conf.doEdit(id, this);
    } else {
      this.router.navigate(
        new Array('/').concat(this.conf.route_edit).concat(id as any),
      );
    }
  }

  // generate delete msg
  getDeleteMessage(item: any, action = T('Delete ')): string {
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
    this.translate.get(deleteMsg).pipe(untilDestroyed(this)).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doDelete(item: any, action?: any): void {
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
      this.conf.config.deleteMsg.doubleConfirm(item)
        .pipe(untilDestroyed(this))
        .subscribe((doubleConfirmDialog: boolean) => {
          if (doubleConfirmDialog) {
            this.toDeleteRow = item;
            this.delete(id);
          }
        });
    } else {
      this.dialogService.confirm({
        title: dialog.hasOwnProperty('title') ? dialog['title'] : T('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        hideCheckBox: dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        buttonMsg: dialog.hasOwnProperty('button') ? dialog['button'] : T('Delete'),
      }).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          this.toDeleteRow = item;
          this.delete(id);
        }
      });
    }
  }

  delete(id: string): void {
    this.loader.open();
    this.loaderOpen = true;
    this.busy = this.ws.call(
      this.conf.wsDelete,
      this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id],
    ).pipe(untilDestroyed(this)).subscribe(
      () => {
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

  doDeleteJob(item: any): Observable<{ state: JobState } | boolean> {
    const deleteMsg = this.getDeleteMessage(item);
    let id: string;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop];
    } else {
      id = item.id;
    }
    let dialog: EntityTableConfirmDialog = {};
    if (this.conf.confirmDeleteDialog) {
      dialog = this.conf.confirmDeleteDialog;
    }

    return this.dialogService
      .confirm({
        title: dialog.hasOwnProperty('title') ? dialog['title'] : T('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        hideCheckBox: dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        buttonMsg: dialog.hasOwnProperty('button') ? dialog['button'] : T('Delete'),
      })
      .pipe(
        filter(Boolean),
        tap(() => {
          this.loader.open();
          this.loaderOpen = true;
        }),
        switchMap(() => {
          const params = this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id];
          return this.ws.call(this.conf.wsDelete, params).pipe(
            take(1),
            catchError((error) => {
              new EntityUtils().handleWSError(this, error, this.dialogService);
              this.loader.close();
              return of(false);
            }),
          );
        }),
        switchMap((jobId: number) => (jobId ? this.job.getJobStatus(jobId) : of(false))),
      );
  }

  getMultiDeleteMessage(items: any): string {
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
    this.translate.get(deleteMsg).pipe(untilDestroyed(this)).subscribe((res) => {
      deleteMsg = res;
    });
    return deleteMsg;
  }

  doMultiDelete(selected: any): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm({
      title: 'Delete',
      message: multiDeleteMsg,
      hideCheckBox: false,
      buttonMsg: T('Delete'),
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        return;
      }

      this.loader.open();
      this.loaderOpen = true;
      if (this.conf.wsMultiDelete) {
        // ws to do multi-delete
        if (this.conf.wsMultiDeleteParams) {
          this.busy = this.ws.job(this.conf.wsMultiDelete, this.conf.wsMultiDeleteParams(selected))
            .pipe(untilDestroyed(this))
            .subscribe(
              (res1) => {
                if (res1.state === JobState.Success) {
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
                    this.dialogService.info(T('Items deleted'), '', '300px', 'info', true);
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
    });
  }

  // Next section operates the checkboxes to show/hide columns
  toggle(col: any): void {
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
  selectColumnsToShowOrHide(): void {
    const obj: any = {};
    obj['title'] = this.title;
    obj['cols'] = this.conf.columns;

    const preferredCols = this.prefService.preferences.tableDisplayedColumns;
    if (preferredCols.length > 0) {
      preferredCols.forEach((column) => {
        if (column.title === this.title) {
          preferredCols.splice(preferredCols.indexOf(column), 1);
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
  resetColViewToDefaults(): void {
    if (!(this.conf.columns.length === this.originalConfColumns.length
        && this.conf.columns.length === this.allColumns.length)) {
      this.conf.columns = this.originalConfColumns;

      this.selectColumnsToShowOrHide();
    }
  }

  isChecked(col: EntityTableColumn): boolean {
    return this.conf.columns.find((c) => c.name === col.name) !== undefined;
  }

  // Toggle between all/none cols selected
  checkAll(): EntityTableColumn[] {
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
  checkLength(): boolean {
    if (this.allColumns && this.conf.columns) {
      return this.conf.columns.length === this.allColumns.length;
    }
  }

  toggleLabels(): void {
    this.multiActionsIconsOnly = !this.multiActionsIconsOnly;
  }

  getButtonClass(row: any): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (row.warnings && row.warnings.length > 0) return 'fn-theme-orange';

    const state: JobState = row.state;

    switch (state) {
      case JobState.Pending: return 'fn-theme-orange';
      case JobState.Running: return 'fn-theme-orange';
      case JobState.Aborted: return 'fn-theme-orange';
      case JobState.Finished: return 'fn-theme-green';
      case JobState.Success: return 'fn-theme-green';
      case JobState.Error: return 'fn-theme-red';
      case JobState.Failed: return 'fn-theme-red';
      case JobState.Hold: return 'fn-theme-yellow';
      default: return 'fn-theme-primary';
    }
  }

  stateClickable(value: any, colConfig: any): boolean {
    if (colConfig.infoStates) {
      return _.indexOf(colConfig.infoStates, value) < 0;
    }
    return value !== JobState.Pending;
  }

  runningStateButton(jobid: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Task is running') } });
    dialogRef.componentInstance.jobId = jobid;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  get columnsProps(): string[] {
    return this.currentColumns.map((column) => column.prop);
  }

  masterToggle(event: MatCheckboxChange): void {
    const showingRows = this.currentRowsThatAreOnScreenToo;
    this.isAllSelected = event.checked;

    if (event.checked) {
      showingRows.forEach((row) => {
        this.selection.select(row);
      });
    } else {
      this.selection.clear();
    }
  }

  getFirstKey(): string {
    return this.conf.config.multiSelect ? this.currentColumns[1].prop : this.currentColumns[0].prop;
  }

  onHover(evt: MouseEvent, over = true): void {
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

  findRow(event: MouseEvent): HTMLElement {
    let target = event.target as HTMLElement;
    do {
      target = target.parentElement;
    } while (target.tagName.toLowerCase() !== 'tr');
    return target;
  }

  isInteractive(column: string): boolean {
    const item = this.currentColumns.find((obj) => obj.prop === column);
    return (item?.checkbox || item?.toggle || item?.button);
  }

  doRowClick(element: Row): void {
    if (this.conf.onRowClick) {
      this.conf.onRowClick(element);
    } else {
      this.expandedElement = this.expandedElement === element ? null : element;
    }
  }

  isBasicColumnTemplate(column: string): boolean {
    return !['expandedDetail', 'action', 'multiselect', 'expansion-chevrons'].includes(column) && !this.isInteractive(column);
  }
}
