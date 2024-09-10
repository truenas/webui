import { ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

export class ColumnComponentType<T> extends ColumnComponent<T> {
  constructor(
    rowTestId: (row: T) => string,
    ariaLabels: (row: T) => string[],
    propertyName?: keyof T,
    title?: string,
    cssClass?: string,
    sortBy?: (row: T) => string | number,
    disableSorting?: boolean,
    getValue?: (row: T) => unknown,
    hidden?: boolean,
    dataProvider?: DataProvider<T>,
    isExtra?: boolean,
  ) {
    super();
    this.propertyName = propertyName;
    this.title = title;
    if (cssClass != null) {
      this.cssClass = cssClass;
    }
    this.uniqueRowTag = rowTestId;
    this.ariaLabels = ariaLabels;
    if (sortBy != null) {
      this.sortBy = sortBy;
    }
    if (disableSorting != null) {
      this.disableSorting = disableSorting;
    }
    if (getValue != null) {
      this.getValue = getValue;
    }
    if (hidden != null) {
      this.hidden = hidden;
    }
    if (isExtra != null) {
      this.isExtra = isExtra;
    }
    if (dataProvider != null) {
      this.dataProvider = dataProvider;
    }
  }
}
