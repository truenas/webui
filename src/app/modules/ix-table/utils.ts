import { get } from 'lodash-es';
import { ColumnComponentType } from 'app/modules/ix-table/interfaces/column-component-type.class';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';

function convertStringToId(inputString: string): string {
  let result = inputString;

  if (!result || result.includes('undefined')) {
    result = result?.replace('undefined', '') || '';
  }

  return result.toLowerCase().replace(/\s+/g, '-');
}

export function createTable<T>(
  columns: Column<T, ColumnComponent<T>>[],
  config: { rowTestId: (row: T) => string; ariaLabels: (row: T) => string[] },
): Column<T, ColumnComponent<T>>[] {
  return columns.map((column) => {
    const rowTestId = (row: T): string => convertStringToId(config.rowTestId(row));
    const ariaLabels = (row: T): string[] => config.ariaLabels(row);
    const columnComponentType = new ColumnComponentType(
      rowTestId,
      ariaLabels,
      column.propertyName,
      column.title,
      column.cssClass,
      column.sortBy,
      column.disableSorting,
      column.getValue,
      column.hidden,
      column.dataProvider,
      column.isExtra,
    );
    return {
      ...column,
      ...columnComponentType,
    };
  });
}

export function filterTableRows<T>(filter: TableFilter<T>): T[] {
  const {
    list = [], query = '', columnKeys = [], preprocessMap,
  } = filter;

  const filterString = query.toLowerCase();
  return list.filter((item) => {
    return columnKeys.some((columnKey) => {
      let value = get(item, columnKey) as string | undefined;
      if (preprocessMap?.[columnKey]) {
        value = preprocessMap[columnKey]?.(value as T[keyof T]);
      }
      return value?.toString()?.toLowerCase()?.includes(filterString);
    });
  });
}
