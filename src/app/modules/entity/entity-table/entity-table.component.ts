import {
  animate, state, style, transition, trigger,
} from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy, ElementRef,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  Observable, of, Subscription, EMPTY, Subject,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { TableDisplayedColumns } from 'app/interfaces/preferences.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import {
  EntityTableAction,
  EntityTableColumn, EntityTableColumnProp,
  EntityTableConfig, EntityTableConfigConfig, EntityTableConfirmDialog,
} from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService, JobService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { ModalService } from 'app/services/modal.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import {
  selectPreferencesState,
  waitForPreferences,
} from 'app/store/preferences/preferences.selectors';

interface SomeRow {
  id?: string | number;
  multiselect_id?: string | number;
  [key: string]: any;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ix-entity-table',
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
export class EntityTableComponent<Row extends SomeRow = any> implements OnInit, AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() conf: EntityTableConfig;

  @ViewChild('newEntityTable', { static: false }) entitytable: TemplateRef<void>;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  dataSourceStreamer$: Subject<Row[]> = new Subject();
  dataSource$: Observable<Row[]> = this.dataSourceStreamer$.asObservable();

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
  selection = new SelectionModel<Row>(true, []);
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

  expandedRows = document.querySelectorAll('.expanded-row').length;
  expandedElement: Row | null = null;

  dataSource: MatTableDataSource<Row>;
  rows: Row[] = [];
  currentRows: Row[] = []; // Rows applying filter
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
  loaderOpen = false;
  protected toDeleteRow: Row;
  private interval: Interval;
  excuteDeletion = false;
  needRefreshTable = false;
  private routeSub: Subscription;

  get currentColumns(): EntityTableColumn[] {
    const result = this.alwaysDisplayedCols.concat(this.conf.columns) as any;

    // Actions without expansion
    if (this.hasActions && result[result.length - 1] !== 'action' && (!this.hasDetails() || !this.hasDetails)) {
      result.push({ prop: 'action' });
    }

    // Expansion
    if (this.hasDetails()) {
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

  constructor(
    protected router: Router,
    public ws: WebSocketService,
    public dialogService: DialogService,
    public loader: AppLoaderService,
    protected translate: TranslateService,
    public storageService: StorageService,
    protected job: JobService,
    protected store$: Store<AppState>,
    protected matDialog: MatDialog,
    public modalService: ModalService,
    public changeDetectorRef: ChangeDetectorRef,
    protected layoutService: LayoutService,
    protected slideIn: IxSlideInService,
  ) {
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

  get currentRowsThatAreOnScreenToo(): Row[] {
    let currentlyShowingRows = [...this.dataSource.filteredData];
    if (this.dataSource.paginator) {
      const start = this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize;
      const rowsCount = currentlyShowingRows.length < start + this.dataSource.paginator.pageSize
        ? currentlyShowingRows.length - start : this.dataSource.paginator.pageSize;
      currentlyShowingRows = currentlyShowingRows.splice(start, rowsCount);
    }
    const showingRows = currentlyShowingRows;
    return this.currentRows.filter((row) => {
      const index = showingRows.findIndex((showingRow) => {
        return showingRow['multiselect_id'] === row['multiselect_id'];
      });
      return index >= 0;
    });
  }

  toggleSelection(element: Row): void {
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
    this.cardHeaderReady = !this.conf.cardHeaderComponent;
    this.hasActions = !this.conf.noActions;
  }

  altInit(): void {
    if (this.conf.config?.pagingOptions?.pageSize) {
      this.paginationPageSize = this.conf.config.pagingOptions.pageSize;
    }
    if (this.conf.config?.pagingOptions?.pageSizeOptions) {
      this.paginationPageSizeOptions = this.conf.config.pagingOptions.pageSizeOptions;
    }

    this.sortKey = (this.conf.config.deleteMsg && this.conf.config.deleteMsg.key_props)
      ? this.conf.config.deleteMsg.key_props[0] as keyof Row
      : this.conf.columns[0].prop as keyof Row;

    if (this.conf.prerequisite) {
      this.conf.prerequisite().then(
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

    this.loadPreferredColumns();
    if (this.firstUse) {
      this.selectColumnsToShowOrHide();
    }

    this.displayedColumns.push('action');
    if (this.conf.changeEvent) {
      this.conf.changeEvent(this);
    }

    if (typeof (this.conf.hideTopActions) !== 'undefined') {
      this.hideTopActions = this.conf.hideTopActions;
    }

    // Delay spinner 500ms so it won't show up on a fast-loading page
    setTimeout(() => {
      this.setShowSpinner();
    }, 500);
  }

  ngAfterViewInit(): void {
    this.dataSource = new MatTableDataSource();
    this.altInit();

    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;

    this.dataSource$
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        if (!this.dataSource) return;

        if (data.length === 0) this.isTableEmpty = true;

        this.dataSource.data = data;

        this.changeDetectorRef.detectChanges();
      });

    // If actionsConfig was disabled, don't show the default toolbar. like the Table is in a Tab.
    if (!this.conf.disableActionsConfig) {
      this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
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
      let emptyType: EmptyType = this.firstUse ? EmptyType.FirstUse : EmptyType.NoPageData;
      if (this.dataSource.filter) {
        emptyType = EmptyType.NoSearchResults;
      }

      this.configureEmptyTable(emptyType);
    }

    if (this.dataSource.paginator && this.conf.config.paging) {
      this.dataSource.paginator.firstPage();
    }
    this.isAllSelected = false;
    this.selection.clear();
  }

  configureEmptyTable(emptyType: EmptyType, error?: string): void {
    if (!emptyType) {
      return;
    }

    let emptyConf = null;
    if (this.conf?.getCustomEmptyConfig) {
      emptyConf = this.conf.getCustomEmptyConfig(emptyType);
      if (emptyConf) {
        this.emptyTableConf = emptyConf;
        return;
      }
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
        title = this.translate.instant('No Search Results.');
        message = this.translate.instant('Your query didn\'t return any results. Please try again.');
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
        title = this.translate.instant('Something went wrong');

        if (error) {
          message = this.translate.instant('The system returned the following error - ');
        }

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
          let buttonText = this.translate.instant('Add ') + this.title;
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
          let buttonText = this.translate.instant('Add ') + this.title;
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

  setShowSpinner(): void {
    this.showSpinner = true;
  }

  getData(): void {
    const sort: string[] = [];

    this.config.sorting.columns.forEach((col) => {
      if (col.sort === 'asc') {
        sort.push(col.name);
      } else if (col.sort === 'desc') {
        sort.push('-' + col.name);
      }
    });

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
    this.getFunction.pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.handleData(res, skipActions);
      },
      error: (res: WebsocketError) => {
        this.isTableEmpty = true;
        this.configureEmptyTable(EmptyType.Errors, String(res.error) || res.reason);
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
    });
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
            res.data.map((row: any) => row[prop] = new EntityUtils().parseDow(row[prop]));
          }
        }
      }
    } else if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
      res = this.conf.resourceTransformIncomingRestData(res);
      for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
        if (res.length > 0 && res[0].hasOwnProperty(prop) && typeof res[0][prop] === 'string') {
          res.map((row: any) => row[prop] = new EntityUtils().parseDow(row[prop]));
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
    if (this.expandedRows === 0 || !this.asyncView || this.excuteDeletion || this.needRefreshTable) {
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

    if (this.conf.config.paging) {
      // On first load, paginator is not rendered because table is empty,
      // so we force render here so that we can get valid paginator instance
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      }, 0);
    }

    this.dataSourceStreamer$.next(this.currentRows);

    return res;
  }

  patchCurrentRows(
    rowSelector: (row: Row) => boolean,
    rowMutator: (row: Row) => Row,
  ): void {
    this.currentRows = this.currentRows.map((row) => {
      if (rowSelector(row)) {
        return rowMutator(row) || row;
      }
      return row;
    });
    this.dataSourceStreamer$.next(this.currentRows);
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
      // Hack to access the private property _elementRef. Do not replace with elementRef.
      const parentNode = (this.entitytable as unknown as { _elementRef: ElementRef })
        ._elementRef.nativeElement.parentNode;
      hasHorizontalScrollbar = parentNode.scrollWidth > parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
  }

  generateRows(res: any): Row[] {
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

    rows.forEach((row) => {
      for (const attr in row) {
        if (row.hasOwnProperty(attr)) {
          row[attr] = this.rowValue(row, attr);
        }
      }
    });

    if (this.rows.length === 0) {
      if (this.conf.queryRes) {
        this.conf.queryRes = rows;
      }
    } else {
      this.currentRows.forEach((row) => {
        const index = _.findIndex(rows, { id: row.id });
        if (index > -1) {
          for (const prop in rows[index]) {
            row[prop as keyof Row] = rows[index][prop];
          }
        }
      });

      const newRows: Row[] = [];
      this.rows.forEach((row) => {
        const index = _.findIndex(rows, { id: row.id });
        if (index < 0) {
          return;
        }
        const updatedItem = rows[index];
        rows.splice(index, 1);
        newRows.push(updatedItem);
      });
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
      label: this.translate.instant('Edit'),
      onClick: (rowinner: Row) => { this.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: Row) => { this.doDelete(rowinner); },
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
      } catch (error: unknown) {
        return row[attr];
      }
    }

    return row[attr];
  }

  doAdd(): void {
    if (this.conf.doAdd) {
      this.conf.doAdd(null, this);
    } else {
      this.router.navigate(new Array('/').concat(this.conf.routeAdd));
    }
  }

  doEdit(id: string | number): void {
    if (this.conf.doEdit) {
      this.conf.doEdit(id, this);
    } else {
      this.router.navigate(
        new Array('/').concat(this.conf.routeEdit).concat(String(id)),
      );
    }
  }

  // generate delete msg
  getDeleteMessage(item: Row, action: string = this.translate.instant('Delete')): string {
    let deleteMsg: string = this.translate.instant('Delete the selected item?');
    if (this.conf.config.deleteMsg) {
      deleteMsg = action + ' ' + this.conf.config.deleteMsg.title;
      let message = ' <b>' + item[this.conf.config.deleteMsg.key_props[0]];
      if (this.conf.config.deleteMsg.key_props.length > 1) {
        for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
          if (item[this.conf.config.deleteMsg.key_props[i]] !== '') {
            message = message + ' - ' + item[this.conf.config.deleteMsg.key_props[i]];
          }
        }
      }
      message += '</b>?';
      deleteMsg += message;
    }

    deleteMsg = this.translate.instant(deleteMsg);

    return deleteMsg;
  }

  doDelete(item: Row, action?: string): void {
    const deleteMsg = this.conf.confirmDeleteDialog && this.conf.confirmDeleteDialog.isMessageComplete
      ? ''
      : this.getDeleteMessage(item, action);

    let id: string | number;
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
        title: dialog.hasOwnProperty('title') ? dialog['title'] : this.translate.instant('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        hideCheckBox: dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        buttonMsg: dialog.hasOwnProperty('button') ? dialog['button'] : this.translate.instant('Delete'),
      }).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          this.toDeleteRow = item;
          this.delete(id);
        }
      });
    }
  }

  delete(id: string | number): void {
    this.loader.open();
    this.loaderOpen = true;
    this.busy = this.ws.call(
      this.conf.wsDelete,
      this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id],
    ).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.getData();
        this.excuteDeletion = true;
        if (this.conf.afterDelete) {
          this.conf.afterDelete();
        }
      },
      error: (error) => {
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.loader.close();
      },
    });
  }

  doDeleteJob(item: Row): Observable<{ state: JobState } | boolean> {
    const deleteMsg = this.getDeleteMessage(item);
    let id: string | number;
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
        title: dialog.hasOwnProperty('title') ? dialog['title'] : this.translate.instant('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        hideCheckBox: dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        buttonMsg: dialog.hasOwnProperty('button') ? dialog['button'] : this.translate.instant('Delete'),
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
              new EntityUtils().handleWsError(this, error, this.dialogService);
              this.loader.close();
              return of(false);
            }),
          );
        }),
        switchMap((jobId: number) => (jobId ? this.job.getJobStatus(jobId) : of(false))),
      );
  }

  getMultiDeleteMessage(items: Row[]): string {
    let deleteMsg = 'Delete the selected items?';
    if (this.conf.config.deleteMsg) {
      deleteMsg = 'Delete selected ' + this.conf.config.deleteMsg.title + '(s)?';
      let message = '<ul>';
      items.forEach((item) => {
        let subMessage;
        if (this.conf.config.deleteMsg.key_props.length > 1) {
          subMessage = '<li><strong>' + item[this.conf.config.deleteMsg.key_props[0]] + '</strong>';
          subMessage += '<ul class="nested-list">';

          for (let i = 1; i < this.conf.config.deleteMsg.key_props.length; i++) {
            if (item[this.conf.config.deleteMsg.key_props[i]] !== '') {
              subMessage += '<li>' + item[this.conf.config.deleteMsg.key_props[i]] + '</li>';
            }
          }
          subMessage += '</ul>';
        } else {
          subMessage = '<li>' + item[this.conf.config.deleteMsg.key_props[0]];
        }

        subMessage += '</li>';
        message += subMessage;
      });
      message += '</ul>';
      deleteMsg += message;
    }
    deleteMsg = this.translate.instant(deleteMsg);

    return deleteMsg;
  }

  doMultiDelete(selected: Row[]): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm({
      title: 'Delete',
      message: multiDeleteMsg,
      hideCheckBox: false,
      buttonMsg: this.translate.instant('Delete'),
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
            .subscribe({
              next: (res1) => {
                if (res1.state !== JobState.Success) {
                  return;
                }

                this.loader.close();
                this.loaderOpen = false;
                this.getData();
                this.selection.clear();

                const selectedName = String(this.conf.wsMultiDeleteParams(selected)[1]);
                let message = '';
                for (let i = 0; i < res1.result.length; i++) {
                  if (res1.result[i].error !== null) {
                    message = `${message}<li>${selectedName[i]}: ${res1.result[i].error}</li>`;
                  }
                }
                if (message === '') {
                  this.dialogService.info(this.translate.instant('Items deleted'), '');
                } else {
                  message = '<ul>' + message + '</ul>';
                  this.dialogService.errorReport(this.translate.instant('Items Delete Failed'), message);
                }
              },
              error: (res1) => {
                new EntityUtils().handleWsError(this, res1, this.dialogService);
                this.loader.close();
                this.loaderOpen = false;
              },
            });
        }
      } else {
        // rest to do multi-delete
      }
    });
  }

  // Next section operates the checkboxes to show/hide columns
  toggle(columnToToggle: EntityTableColumn): void {
    const isChecked = this.isChecked(columnToToggle);
    this.anythingClicked = true;

    if (isChecked) {
      this.conf.columns = this.conf.columns.filter((column) => column.name !== columnToToggle.name);
    } else {
      this.conf.columns = [...this.conf.columns, columnToToggle];
    }
    this.selectColumnsToShowOrHide();
  }

  // Stores currently selected columns in preference service
  selectColumnsToShowOrHide(): void {
    const newColumnPreferences: TableDisplayedColumns = {
      title: this.title,
      cols: this.conf.columns as any,
    };

    this.store$.pipe(select(selectPreferencesState), take(1), untilDestroyed(this)).subscribe((state) => {
      if (!state.areLoaded) {
        return;
      }

      const existingPreferredColumns = state.preferences.tableDisplayedColumns || [];
      const preferredColumns = existingPreferredColumns.filter((column) => {
        return column.title !== this.title;
      });
      preferredColumns.push(newColumnPreferences);

      this.store$.dispatch(preferredColumnsUpdated({ columns: preferredColumns }));
      this.changeDetectorRef.detectChanges();
    });
  }

  // resets col view to the default set in the table's component
  resetColViewToDefaults(): void {
    if (!(this.conf.columns.length === this.originalConfColumns.length
        && this.conf.columns.length === this.allColumns.length)) {
      this.conf.columns = this.originalConfColumns;

      this.selectColumnsToShowOrHide();
    }
  }

  isChecked(columnToTest: EntityTableColumn): boolean {
    return this.conf.columns.find((column) => column.name === columnToTest.name) !== undefined;
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

  getButtonClass(row: { warnings: unknown[]; state: JobState }): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (row.warnings && row.warnings.length > 0) return 'fn-theme-orange';

    const state: JobState = row.state;

    switch (state) {
      case JobState.Pending:
      case JobState.Running:
      case JobState.Aborted:
        return 'fn-theme-orange';
      case JobState.Finished:
      case JobState.Success:
        return 'fn-theme-green';
      case JobState.Error:
      case JobState.Failed:
        return 'fn-theme-red';
      case JobState.Locked:
      case JobState.Hold:
        return 'fn-theme-yellow';
      default:
        return 'fn-theme-primary';
    }
  }

  runningStateButton(jobid: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Task is running') } });
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

    for (const cell of cells) {
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
    return (item?.checkbox || item?.toggle || item?.button || item?.showLockedStatus);
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

  private loadPreferredColumns(): void {
    this.store$.pipe(waitForPreferences, take(1), untilDestroyed(this)).subscribe((preferences) => {
      const preferredCols = preferences.tableDisplayedColumns || [];
      // Turn off preferred cols for snapshots to allow for two different column sets to be displayed
      if (preferredCols.length < 0) {
        return;
      }

      preferredCols.forEach((column) => {
        // If preferred columns have been set for THIS table...
        if (column.title !== this.title) {
          return;
        }

        this.firstUse = false;
        this.conf.columns = column.cols.filter((col) => {
          // Remove columns if they are already present in always displayed columns
          return !this.alwaysDisplayedCols.find((item) => item.prop === col.prop);
        });

        // Remove columns from display and preferred cols if they don't exist in the table
        const notFound: EntityTableColumnProp[] = [];
        this.conf.columns.forEach((col) => {
          const found = this.filterColumns.find((filterColumn) => filterColumn.prop === col.prop);
          if (!found) {
            notFound.push(col.prop);
          }
        });
        this.conf.columns = this.conf.columns.filter((col) => !notFound.includes(col.prop));
        this.selectColumnsToShowOrHide();
      });

      this.changeDetectorRef.markForCheck();
    });
  }
}
