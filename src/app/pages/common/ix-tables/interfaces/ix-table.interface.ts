import { DataSource } from '@angular/cdk/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';

/**
 * Simple Table
 */
export interface IxTable<T = any> {
  displayedColumns: string[];
  dataSource: DataSource<T>;
  getData: () => void;
  doAdd: () => void;
  doEdit: (row: T) => void;
  doDelete: (row: T) => void;
}

/**
 * Ix Table Paginator
 */
export interface IxTablePaginator {
  paginator: MatPaginator;
  pageIndex: number;
  pageSize: number;
}

/**
 * Ix Table Sort
 */
export interface IxTableSort {
  sort: MatSort;
  defaultSort: Sort;
}

/**
 * Ix Table Expandable Row
 * @template T
 */
export interface IxTableExpandableRow<T = any> {
  expandedRow: T;
  expandRow: (row: T) => void;
}

/**
 * Advanced Table includes IxTable<T>, IxTablePaginator, IxTableSort
 */
export interface IxTableAdvanced<T = any> extends IxTable<T>, IxTableSort {}
