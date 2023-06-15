import { Component, Input } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-table-head, thead[ix-table-head]',
  templateUrl: './ix-table-head.component.html',
  styleUrls: ['ix-table-head.component.scss'],
})
export class IxTableHeadComponent<T> {
  @Input() columns: TableColumn<T>[];
  @Input() dataProvider: ArrayDataProvider<T>;

  onSort(columnId: number): void {
    if (!this.columns[columnId].sortable) {
      return;
    }

    const currentDirection = this.dataProvider.sorting.direction;
    const currentActive = this.dataProvider.sorting.active;

    let direction = currentDirection;
    let active = currentActive;

    if (currentActive !== columnId) {
      direction = null;
      active = columnId;
    }
    if (direction === null) {
      direction = 'asc';
    } else if (currentDirection === 'asc') {
      direction = 'desc';
    } else if (currentDirection === 'desc') {
      direction = null;
    }

    this.dataProvider.setSorting({
      propertyName: this.columns[columnId].propertyName,
      sortBy: this.columns[columnId].sortBy,
      direction,
      active,
    });
  }
}
