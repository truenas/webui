/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-optional-chain */
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
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import {
  Observable, of, Subscription, EMPTY, Subject, BehaviorSubject,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiCallMethod, ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { TableDisplayedColumns } from 'app/interfaces/preferences.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import {
  EntityTableAction,
  EntityTableColumn, EntityTableColumnProp,
  EntityTableConfig, EntityTableConfigConfig, EntityTableConfirmDialog, SomeRow,
} from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import {
  selectPreferencesState,
  waitForPreferences,
} from 'app/store/preferences/preferences.selectors';

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
export class EntityTableComponent<Row extends SomeRow = SomeRow> implements OnInit, AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() conf: EntityTableConfig<Row>;

  @ViewChild('newEntityTable', { static: false }) entitytable: TemplateRef<void>;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  dataSourceStreamer$ = new Subject<Row[]>();
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
  columns: {
    name: string;
    sort?: 'asc' | 'desc';
  }[] = [];

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
  getFunction: Observable<unknown>;
  config: EntityTableConfigConfig = {
    paging: true,
    sorting: { columns: this.columns },
  };
  showDefaults = false;
  showSpinner = true;
  cardHeaderReady = false;
  showActions = true;
  hasActions = true;
  sortKey: keyof Row;
  filterValue = ''; // the filter string filled in search input.
  readonly EntityJobState = JobState;
  loaderOpen = false;
  protected toDeleteRow: Row;
  private interval: Interval;
  executeDeletion = false;
  needRefreshTable = false;
  private routeSub: Subscription;
  checkboxLoaders = new Map<string, BehaviorSubject<boolean>>();

  get currentColumns(): EntityTableColumn[] {
    const result = this.alwaysDisplayedCols.concat(this.conf.columns);

    // Actions without expansion
    if (this.hasActions && (result[result.length - 1] as unknown) !== 'action' && (!this.hasDetails() || !this.hasDetails)) {
      result.push({ prop: 'action' } as EntityTableColumn);
    }

    // Expansion
    if (this.hasDetails()) {
      result.push({ prop: 'expansion-chevrons' } as EntityTableColumn);
    }

    if (this.conf.config.multiSelect) {
      result.unshift({ prop: 'multiselect' } as EntityTableColumn);
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
    protected store$: Store<AppState>,
    protected matDialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
  ) {
    // watch for navigation events as ngOnDestroy doesn't always trigger on these
    this.routeSub = this.router.events.pipe(untilDestroyed(this)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.cleanup();
      }
    });
  }

  ngOnInit(): void {
    this.cardHeaderReady = !this.conf.cardHeaderComponent;
    this.hasActions = !this.conf.noActions;
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
        return showingRow.multiselect_id === row.multiselect_id;
      });
      return index >= 0;
    });
  }

  toggleSelection(element: Row): void {
    this.selection.toggle(element);

    const allShown = this.currentRowsThatAreOnScreenToo;
    this.isAllSelected = allShown.every((row) => this.selection.isSelected(row));
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
          } else if (this.conf.prerequisiteFailedHandler) {
            this.conf.prerequisiteFailedHandler(this);
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
  }

  // Filter the table by the filter string.
  filter(filterValue: string): void {
    if (!this.dataSource) {
      return;
    }

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
      let emptyType: EmptyType = EmptyType.NoPageData;

      if (this.firstUse && !this.showSpinner) {
        emptyType = EmptyType.FirstUse;
      } else if (this.showSpinner) {
        emptyType = EmptyType.Loading;
      } else if (this.dataSource.filter) {
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
            this.emptyTableConf.message += this.translate.instant(' Please click the button below to add {item}.', {
              item: this.title,
            });
          }
          let buttonText = this.translate.instant('Add ') + this.title;
          if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.buttonText) {
            buttonText = this.conf.emptyTableConfigMessages.buttonText;
          }
          this.emptyTableConf.button = {
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
            this.emptyTableConf.message += this.translate.instant(' Please click the button below to add {item}.', {
              item: this.title,
            });
          }
          let buttonText = this.translate.instant('Add ') + this.title;
          if (this.conf.emptyTableConfigMessages && this.conf.emptyTableConfigMessages.buttonText) {
            buttonText = this.conf.emptyTableConfigMessages.buttonText;
          }
          this.emptyTableConf.button = {
            label: buttonText,
            action: this.doAdd.bind(this),
          };
        }
        break;
    }
  }

  getData(): void {
    this.showSpinner = true;

    if (this.conf.queryCall) {
      if (this.conf.queryCallJob) {
        if (this.conf.queryCallOption) {
          this.getFunction = this.ws.job(this.conf.queryCall as ApiJobMethod, this.conf.queryCallOption);
        } else {
          this.getFunction = this.ws.job(this.conf.queryCall as ApiJobMethod, []);
        }
      } else if (this.conf.queryCallOption) {
        this.getFunction = this.ws.call(
          this.conf.queryCall as ApiCallMethod,
          this.conf.queryCallOption as ApiCallParams<ApiCallMethod>,
        );
      } else {
        this.getFunction = this.ws.call(this.conf.queryCall as ApiCallMethod, []);
      }
    } else {
      this.getFunction = EMPTY;
    }

    if (this.conf.callGetFunction) {
      this.conf.callGetFunction(this);
    } else {
      this.callGetFunction();
    }
  }

  callGetFunction(skipActions = false): void {
    this.getFunction.pipe(untilDestroyed(this)).subscribe({
      next: (response) => {
        this.handleData(response, skipActions);
      },
      error: (error: WebsocketError) => {
        this.isTableEmpty = true;
        this.configureEmptyTable(EmptyType.Errors, String(error.error) || error.reason);
        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (error.hasOwnProperty('reason') && (error.hasOwnProperty('trace') && error.hasOwnProperty('type'))) {
          this.dialogService.error(this.errorHandler.parseWsError(error));
        } else {
          this.dialogService.error(this.errorHandler.parseError(error));
        }
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleData(response: any, skipActions = false): Record<string, unknown> {
    this.expandedRows = document.querySelectorAll('.expanded-row').length;
    const cache = this.expandedElement;
    this.expandedElement = this.expandedRows > 0 ? cache : null;

    if (typeof (response) === 'undefined' || typeof (response.data) === 'undefined') {
      response = {
        data: response as unknown,
      };
    }

    if (response.data) {
      if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
        response.data = this.conf.resourceTransformIncomingRestData(response.data);
        for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
          if (response.data.length > 0 && Object.hasOwnProperty.call(response.data[0], prop) && typeof response.data[0][prop] === 'string') {
            (response.data as Record<string, string>[]).forEach((row) => {
              row[prop] = new EntityUtils().parseDow(row[prop]);
            });
          }
        }
      }
    } else if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
      response = this.conf.resourceTransformIncomingRestData(response);
      for (const prop of ['schedule', 'cron_schedule', 'cron', 'scrub_schedule']) {
        if (response.length > 0 && Object.hasOwnProperty.call(response[0], prop) && typeof response[0][prop] === 'string') {
          (response as Record<string, string>[]).forEach((row) => {
            row[prop] = new EntityUtils().parseDow(row[prop]);
          });
        }
      }
    }

    this.rows = this.generateRows(response);
    this.currentRows = this.rows;

    if (!skipActions) {
      this.storageService.tableSorter(this.rows, this.sortKey, 'asc');
    }
    if (this.conf.dataHandler) {
      this.conf.dataHandler(this).pipe(untilDestroyed(this)).subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
    }

    if (this.conf.addRows) {
      this.conf.addRows(this);
    }
    if (!this.showDefaults) {
      this.currentRows = this.filterValue === '' ? this.rows : this.currentRows;
      this.paginationPageIndex = 0;
      this.showDefaults = true;
    }
    if (this.expandedRows === 0 || this.executeDeletion || this.needRefreshTable) {
      this.executeDeletion = false;
      this.needRefreshTable = false;

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

    this.showSpinner = false;

    return response;
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
      const parentNode = (this.entitytable as unknown as { _elementRef: ElementRef<HTMLElement> })
        ._elementRef.nativeElement.parentNode as HTMLElement;
      hasHorizontalScrollbar = parentNode.scrollWidth > parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateRows(response: any): Row[] {
    let rows: Row[];
    if (this.loaderOpen) {
      this.loader.close();
      this.loaderOpen = false;
    }

    if (response.data) {
      if (response.data.result) {
        rows = new EntityUtils().flattenData(response.data.result) as Row[];
      } else {
        rows = new EntityUtils().flattenData(response.data) as Row[];
      }
    } else {
      rows = new EntityUtils().flattenData(response) as Row[];
    }

    rows.forEach((row) => {
      Object.keys(row).forEach((attr) => {
        (row[attr as keyof Row] as unknown) = this.rowValue(row, attr);
      });
    });

    if (this.rows.length === 0) {
      if (this.conf.queryRes) {
        this.conf.queryRes = rows;
      }
    } else {
      this.currentRows.forEach((row) => {
        const index = _.findIndex(rows, { id: row.id } as _.PartialShallow<Row>);
        if (index > -1) {
          Object.keys(rows[index]).forEach((prop) => {
            row[prop as keyof Row] = rows[index][prop] as Row[keyof Row];
          });
        }
      });

      const newRows: Row[] = [];
      this.rows.forEach((row) => {
        const index = _.findIndex(rows, { id: row.id } as _.PartialShallow<Row>);
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

  rowValue(row: Record<string, unknown>, attr: string): unknown {
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
      id = item[this.conf.config.deleteMsg.id_prop] as string | number;
    } else {
      id = item.id;
    }

    const dialog = this.conf.confirmDeleteDialog || {};
    if (dialog.buildTitle) {
      dialog.title = dialog.buildTitle(item);
    }
    if (dialog.buttonMessage) {
      dialog.button = dialog.buttonMessage(item);
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
        title: dialog.hasOwnProperty('title') ? dialog.title : this.translate.instant('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog.message + deleteMsg : deleteMsg,
        hideCheckbox: dialog.hasOwnProperty('hideCheckbox') ? dialog.hideCheckbox : false,
        buttonText: dialog.hasOwnProperty('button') ? dialog.button : this.translate.instant('Delete'),
      }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (confirmed) {
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
      this.conf.wsDelete as ApiCallMethod,
      (
        this.conf.wsDeleteParams
          ? this.conf.wsDeleteParams(this.toDeleteRow, id)
          : [id]
      ) as ApiCallParams<ApiCallMethod>,
    ).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.getData();
        this.executeDeletion = true;
        if (this.conf.afterDelete) {
          this.conf.afterDelete();
        }
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.loader.close();
      },
    });
  }

  doDeleteJob(item: Row): Observable<{ state: JobState } | boolean> {
    const deleteMsg = this.getDeleteMessage(item);
    let id: string | number;
    if (this.conf.config.deleteMsg && this.conf.config.deleteMsg.id_prop) {
      id = item[this.conf.config.deleteMsg.id_prop] as string | number;
    } else {
      id = item.id;
    }
    let dialog: EntityTableConfirmDialog = {};
    if (this.conf.confirmDeleteDialog) {
      dialog = this.conf.confirmDeleteDialog;
    }

    return this.dialogService
      .confirm({
        title: dialog.hasOwnProperty('title') ? dialog.title : this.translate.instant('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog.message + deleteMsg : deleteMsg,
        hideCheckbox: dialog.hasOwnProperty('hideCheckbox') ? dialog.hideCheckbox : false,
        buttonText: dialog.hasOwnProperty('button') ? dialog.button : this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        tap(() => {
          this.loader.open();
          this.loaderOpen = true;
        }),
        switchMap(() => {
          const params = this.conf.wsDeleteParams ? this.conf.wsDeleteParams(this.toDeleteRow, id) : [id];
          return this.ws.call(this.conf.wsDelete as ApiCallMethod, params as ApiCallParams<ApiCallMethod>).pipe(
            take(1),
            catchError((error) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              this.loader.close();
              return of(false);
            }),
          );
        }),
        switchMap((jobId: number) => (jobId ? this.store$.select(selectJob(jobId)) : of(false))),
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

  checkboxChanged(element: Row): void {
    if (!this.checkboxLoaders.get(this.getRowIdentifier(element))) {
      this.checkboxLoaders.set(this.getRowIdentifier(element), new BehaviorSubject(false));
    }
    this.conf.onCheckboxChange(element, this.checkboxLoaders.get(this.getRowIdentifier(element)));
  }

  getRowIdentifier(row: Row): string {
    if (row) {
      return row.id || row.identifier || row.uuid || row.name || row.path || row.num || UUID.UUID();
    }
    return UUID.UUID();
  }

  getDisabled(column: string): boolean {
    return Boolean(_.find(this.allColumns, { prop: column })?.disabled);
  }

  isPaddedAway(index: number): boolean {
    return !this.shouldApplyStickyOffset(index)
      && !(this.isLeftStickyColumnNo(index) && this.isTableOverflow());
  }

  doMultiDelete(selected: Row[]): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm({
      title: 'Delete',
      message: multiDeleteMsg,
      hideCheckbox: false,
      buttonText: this.translate.instant('Delete'),
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.loader.open();
      this.loaderOpen = true;
      if (this.conf.wsMultiDelete) {
        // ws to do multi-delete
        if (this.conf.wsMultiDeleteParams) {
          this.busy = this.ws.job(
            this.conf.wsMultiDelete,
            this.conf.wsMultiDeleteParams(selected) as ApiJobParams<ApiJobMethod>,
          )
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (res1: Job<CoreBulkResponse[]>) => {
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
                  this.snackbar.success(this.translate.instant('Items deleted'));
                } else {
                  message = '<ul>' + message + '</ul>';
                  this.dialogService.error({
                    title: this.translate.instant('Items Delete Failed'),
                    message,
                  });
                }
              },
              error: (res1) => {
                this.dialogService.error(this.errorHandler.parseWsError(res1));
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
    // TODO: Some type here is incorrect
    const newColumnPreferences = {
      title: this.title,
      cols: this.conf.columns,
    } as unknown as TableDisplayedColumns;

    this.store$.pipe(select(selectPreferencesState), take(1), untilDestroyed(this)).subscribe((preferencesState) => {
      if (!preferencesState.areLoaded) {
        return;
      }

      const existingPreferredColumns = preferencesState.preferences.tableDisplayedColumns || [];
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

    return false;
  }

  getButtonClass(row: { warnings: unknown[]; state: JobState }): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (row.warnings && row.warnings.length > 0) return 'fn-theme-orange';

    const jobState = row.state;

    switch (jobState) {
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
      if (preferredCols.length === 0) {
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

  asGenericTable(entity: EntityTableComponent<Row>): EntityTableComponent<Record<string, unknown>> {
    return entity as EntityTableComponent<Record<string, unknown>>;
  }
}
