import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { DialogService } from 'app/services/dialog.service';

export abstract class ColumnComponent<T> {
  identifier?: boolean;
  propertyName: keyof T;
  title?: string;
  cssClass?: string;
  sortBy?: (row: T) => string | number;
  sortable?: boolean;
  getValue?: (row: T) => T[keyof T];
  hidden = false;

  protected get value(): T[keyof T] {
    return this.getValue ? this.getValue(this.row) : this.row[this.propertyName];
  }

  protected row: T;
  getRow(): T {
    return this.row;
  }
  setRow(row: T): void {
    this.row = row;
  }
  dataProvider?: ArrayDataProvider<T>;
}

export type Column<T, C extends ColumnComponent<T>> = {
  type?: new (matDialog?: MatDialog, translate?: TranslateService, dialogService?: DialogService) => C;
  headerType?: new () => C;
} & Partial<C>;
