import { Type } from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';
import { IxHeaderCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head-cells/ix-header-cell-base/ix-header-cell-base.component';

export interface TableColumn<T> {
  title?: string;
  propertyName: keyof T;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  bodyCellType?: Type<IxBodyCellBaseComponent<T>>;
  headerCellType?: Type<IxHeaderCellBaseComponent<T>>;
}

export interface TableColumnDate<T> extends TableColumn<T> {
  format: string;
}

export interface TableColumnDelete<T> extends TableColumn<T> {
  onRowDelete: (row: T) => void;
}
