/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Type } from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { Observable, Subject } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';

export interface SomeRow {
  id?: string | number;
  multiselect_id?: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface EntityTableConfig<Row extends SomeRow = SomeRow> {
  columns: EntityTableColumn[];
  actionsOutOfHeader?: boolean;
  title?: string;

  prerequisite?: () => Promise<boolean>;
  globalConfig?: EntityTableGlobalConfig;
  columnFilter?: boolean;
  hideTopActions?: boolean;
  queryCall?: ApiCallMethod | ApiJobMethod;
  queryCallOption?: unknown;
  queryCallJob?: boolean;
  resourceName?: string;
  routeEdit?: string | string[];
  routeAdd?: string[];
  queryRes?: unknown[];
  showActions?: boolean;
  isActionVisible?: (actionId: string | number, row: Row) => boolean;
  customActions?: unknown[];
  multiActions?: EntityTableMultiAction<Row>[];
  noActions?: boolean;
  config: EntityTableConfigConfig;
  confirmDeleteDialog?: EntityTableConfirmDialog<Row>;
  hasDetails?: boolean;
  rowDetailComponent?: Type<unknown>;
  cardHeaderComponent?: Type<unknown>;
  wsDelete?: ApiCallMethod | ApiJobMethod;
  wsMultiDelete?: ApiJobMethod;
  noAdd?: boolean;
  emptyTableConfigMessages?: {
    errors?: { title: string; message: string };
    first_use?: { title: string; message: string };
    loading?: { title: string; message: string };
    no_page_data?: { title: string; message: string };
    no_search_results?: { title: string; message: string };
    buttonText?: string;
  };
  rowIdentifier?: string;
  disableActionsConfig?: boolean;
  inlineActions?: boolean;
  addBtnDisabled?: boolean;
  routeAddTooltip?: string;
  filterValue?: string;

  /**
   * Returns EmptyConfig for EmptyType or returns null if default behavior is acceptable for that EmptyType
   */
  getCustomEmptyConfig?: (emptyType: EmptyType) => EmptyConfig;
  wsDeleteParams?: (row: Row, id: string | number) => unknown;
  addRows?: (entity: EntityTableComponent<Row>) => void;
  changeEvent?: (entity: EntityTableComponent<Row>) => void;
  preInit?: (entity: EntityTableComponent<Row>) => void;
  afterInit?: (entity: EntityTableComponent<Row>) => void;
  dataHandler?: (entity: EntityTableComponent<Row>) => Observable<unknown>;
  resourceTransformIncomingRestData?: (data: unknown) => unknown;
  getActions?: (row: Row) => EntityTableAction<Row>[];
  getAddActions?: () => EntityTableAction<Row>[];
  rowValue?: (row: unknown, attr: string) => unknown;
  wsMultiDeleteParams?: (selected: Row[]) => [string, (string[][] | number[][])?];
  doAdd?: (id?: string | number, tableComponent?: EntityTableComponent<Row>) => void;
  doEdit?: (id?: string | number, tableComponent?: EntityTableComponent<Row>) => void;
  onCheckboxChange?: (row: Row, checkboxLoader$?: Subject<boolean>) => void;
  onSliderChange?: (row: Row) => void;
  onButtonClick?: (row: Row) => void;
  callGetFunction?: (entity: EntityTableComponent<Row>) => void;
  prerequisiteFailedHandler?: (entity: EntityTableComponent<Row>) => void;
  afterDelete?(): void;

  onRowClick?: (row: Row) => void;
}

export interface EntityTableAction<Row extends SomeRow = SomeRow> {
  id: string | number;
  // TODO: Either name or actionName may be unnecessary
  name: string;
  actionName?: string;
  color?: string;
  icon: string;
  label: string;
  onClick: (row?: Row) => void;
  title?: string;
  disabled?: boolean;
  actions?: EntityTableAction<Row>[];
  matTooltip?: string;
  ttposition?: TooltipPosition;
}

export interface EntityTableMultiAction<Row = unknown> {
  id: string;
  onClick: (selection: Row[]) => void;
  icon: string;
  label: string;
  enable: boolean;
  ttpos: TooltipPosition;
}

// The name is not smart, but it reflects the reality.
export interface EntityTableConfigConfig {
  name?: string; // TODO: Unclear if this field actually exists
  paging?: boolean;
  multiSelect?: boolean;
  deleteMsg?: {
    doubleConfirm?: (item: unknown) => Observable<boolean>;
    id_prop?: string;
    title?: string;
    key_props: string[];
  };
  pagingOptions?: {
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  sorting?: {
    columns: {
      name: string;
      sort?: 'asc' | 'desc';
    }[];
  };
}

export interface EntityTableColumn {
  prop: EntityTableColumnProp;
  name: string;

  maxWidth?: number;
  always_display?: boolean;
  hidden?: boolean;
  checkbox?: boolean;
  toggle?: boolean;
  button?: boolean;
  disabled?: boolean;
  enableMatTooltip?: boolean;
  showLockedStatus?: boolean;
  emptyText?: string;

  icon?: string;
  widget?: {
    component: string;
    icon: string;
  };

  /**
   * TODO: These below probably do not do anything.
   */
  minWidth?: number;
  selectable?: boolean;
}

export type EntityTableColumnProp = string
| 'expandedDetail'
| 'expansion-chevrons'
| 'action'
| 'multiselect'
| 'state'
| 'enabled' | 'enable' | 'autostart';

export interface EntityTableGlobalConfig {
  id: string;
  tooltip?: string;
  icon?: string;
  onClick: () => void;
}

export interface EntityTableConfirmDialog<Row = unknown> {
  title?: string;
  message?: string;
  hideCheckbox?: boolean;
  button?: string;
  isMessageComplete?: boolean;
  buildTitle?: (row: Row) => string;
  buttonMessage?: (row: Row) => string;
}
