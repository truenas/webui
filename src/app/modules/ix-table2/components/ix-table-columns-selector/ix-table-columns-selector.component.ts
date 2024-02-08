import { SelectionModel } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@UntilDestroy()
@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableColumnsSelectorComponent<T = unknown> implements OnChanges {
  @Input() columns: Column<T, ColumnComponent<T>>[];
  @Output() columnsChange = new EventEmitter<Column<T, ColumnComponent<T>>[]>();
  hiddenColumns = new SelectionModel<Column<T, ColumnComponent<T>>>(true, []);
  private defaultColumns: Column<T, ColumnComponent<T>>[];

  get isAllChecked(): boolean {
    return this.isOnlyOneColumnSelected;
  }

  get isOnlyOneColumnSelected(): boolean {
    return this.columns.filter((column) => !column.hidden && !!column.title).length === 1;
  }

  constructor(private cdr: ChangeDetectorRef) {
    this.subscribeToColumnsChange();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.columns.firstChange) {
      this.defaultColumns = changes.columns.currentValue.filter((column) => !!column.title);
      this.setInitialState();
    }
  }

  toggleAll(): void {
    if (this.isAllChecked) {
      this.columns.forEach((column) => this.hiddenColumns.deselect(column));
    } else {
      this.columns.forEach((column) => this.hiddenColumns.select(column));
    }

    if (!this.columns.filter((column) => !column.hidden).length) {
      this.toggle(this.columns[0]);
    }

    this.emitColumnsChange();
  }

  isSelected(column: Column<T, ColumnComponent<T>>): boolean {
    return this.hiddenColumns.isSelected(column);
  }

  resetToDefaults(): void {
    this.setInitialState();
  }

  toggle(column: Column<T, ColumnComponent<T>>): void {
    if (this.isOnlyOneColumnSelected && !this.isSelected(column)) {
      return;
    }
    this.hiddenColumns.toggle(column);
    this.emitColumnsChange();
    this.cdr.markForCheck();
  }

  private setInitialState(): void {
    this.columns = _.cloneDeep(this.defaultColumns);
    this.hiddenColumns.select(...this.columns);

    this.defaultColumns
      .filter((column) => !column.hidden)
      .map((column) => this.defaultColumns.findIndex((column2) => column.title === column2.title))
      .forEach((val) => this.toggle(this.columns[val]));

    this.emitColumnsChange();
    this.cdr.markForCheck();
  }

  private subscribeToColumnsChange(): void {
    this.hiddenColumns.changed
      .pipe(untilDestroyed(this))
      .subscribe((values) => {
        if (values.removed.length) {
          this.columns.find((column) => column.propertyName === values.removed[0].propertyName).hidden = false;
        }
        if (values.added.length) {
          this.columns.find((column) => column.propertyName === values.added[0].propertyName).hidden = true;
        }
        this.emitColumnsChange();
        this.cdr.markForCheck();
      });
  }

  private emitColumnsChange(): void {
    this.columnsChange.emit([...this.columns]);
  }
}
