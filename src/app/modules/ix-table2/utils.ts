import { IxCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { IxCellDateComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { IxCellDeleteComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-delete/ix-cell-delete.component';
import { IxCellSizeComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { IxCellTextComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxCellYesNoComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

export function createTable<T>(columns: Column<T, ColumnComponent<T>>[]): Column<T, ColumnComponent<T>>[] {
  return columns;
}

export function textColumn<T>(options: Partial<IxCellTextComponent<T>>): Column<T, IxCellTextComponent<T>> {
  return { ...options };
}

export function checkboxColumn<T>(options: Partial<ColumnComponent<T>>): Column<T, ColumnComponent<T>> {
  return { type: IxCellCheckboxComponent, headerType: IxHeaderCellCheckboxComponent, ...options };
}

export function dateColumn<T>(options: Partial<IxCellDateComponent<T>>): Column<T, IxCellDateComponent<T>> {
  return { type: IxCellDateComponent, ...options };
}

export function deleteColumn<T>(options: Partial<IxCellDeleteComponent<T>>): Column<T, IxCellDeleteComponent<T>> {
  return { type: IxCellDeleteComponent, ...options };
}

export function yesNoColumn<T>(options: Partial<IxCellYesNoComponent<T>>): Column<T, IxCellYesNoComponent<T>> {
  return { type: IxCellYesNoComponent, ...options };
}

export function sizeColumn<T>(options: Partial<IxCellSizeComponent<T>>): Column<T, IxCellSizeComponent<T>> {
  return { type: IxCellSizeComponent, ...options };
}
