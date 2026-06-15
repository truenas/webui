import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type TnSortEvent } from '@truenas/ui-components';
import { get } from 'lodash-es';
import { convertStringDiskSizeToBytes } from 'app/helpers/file-size.utils';
import type { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';

export function convertStringToId(inputString: string): string {
  let result = inputString;

  if (!result || result.includes('undefined')) {
    result = result?.replace('undefined', '') || '';
  }

  return result
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[/,#.[\]@!$%^&*()+={}|\\:;"'<>?`~]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config: { uniqueRowTag: (row: T) => string; ariaLabels: (row: T) => string[] },
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => {
    const uniqueRowTag = (row: T): string => convertStringToId(config.uniqueRowTag(row));
    const ariaLabels = (row: T): string[] => config.ariaLabels(row);
    return {
      ...column,
      uniqueRowTag,
      ariaLabels,
    };
  });
}

/**
 * Translates a tn-table `(sortChange)` event into the `TableSort` shape our
 * data providers expect. `active` is the index of the sorted column within the
 * displayed column list (or `null` when sorting is cleared). Shared so every
 * tn-table migration maps sort state the same way.
 */
export function mapTnSortToTableSort<T>(
  event: TnSortEvent,
  displayedColumns: string[],
): TableSort<T> {
  let direction: SortDirection | null = null;
  if (event.direction === 'asc') {
    direction = SortDirection.Asc;
  } else if (event.direction === 'desc') {
    direction = SortDirection.Desc;
  }

  const columnIndex = displayedColumns.indexOf(event.column);
  return {
    propertyName: direction ? (event.column as keyof T) : null,
    direction,
    active: direction && columnIndex >= 0 ? columnIndex : null,
  };
}

/**
 * Adapts a data provider's paged rows into a signal for binding to a `tn-table`
 * `[dataSource]`. Replaces the `(dataProvider.currentPage$ | async) ?? []` idiom
 * so migrated cards follow the declarative-signal recipe. Must be called from an
 * injection context (e.g. a component field initializer).
 */
export function dataProviderRows<T>(provider: BaseDataProvider<T>): Signal<T[]> {
  return toSignal(provider.currentPage$, { initialValue: [] as T[] });
}

/**
 * Adapts a data provider's loading state into a signal for binding to a `tn-table`
 * `[loading]`. Must be called from an injection context (e.g. a component field
 * initializer).
 */
export function dataProviderLoading<T>(provider: BaseDataProvider<T>): Signal<boolean> {
  return toSignal(provider.isLoading$, { initialValue: false });
}

export function filterTableRows<T>(filter: TableFilter<T>): T[] {
  const {
    list = [], query = '', columnKeys = [], preprocessMap, exact = false,
  } = filter;

  const searchQuery = query.toLowerCase();
  return list.filter((item) => {
    return columnKeys.some((columnKey) => {
      let value = get(item, columnKey) as string | undefined;

      if ((columnKey as string) === 'size' && typeof value === 'number') {
        const margin = value * 0.05;
        const parsedQuerySize = convertStringDiskSizeToBytes(searchQuery) as number;

        return (value >= parsedQuerySize - margin && value <= parsedQuerySize + margin);
      }

      if (preprocessMap?.[columnKey]) {
        value = preprocessMap[columnKey]?.(value as T[keyof T]);
      }

      const valueString = value?.toString()?.toLowerCase();
      return exact ? valueString === searchQuery : valueString?.includes(searchQuery);
    });
  });
}
