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
    return this.hiddenColumns.selected.length === this.columns.length - 1;
  }

  constructor(private cdr: ChangeDetectorRef) {
    this.subscribeToColumnsChange();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.columns.firstChange) {
      this.defaultColumns = changes.columns.currentValue;
      this.setInitialState();
    }
  }

  toggleAll(): void {
    if (this.isAllChecked) {
      this.columns.slice(1).forEach((column) => this.hiddenColumns.deselect(column));
    } else {
      this.columns.slice(1).forEach((column) => this.hiddenColumns.select(column));
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
    if (this.isAllChecked && !this.isSelected(column)) {
      return;
    }
    this.hiddenColumns.toggle(column);
    this.emitColumnsChange();
    this.cdr.markForCheck();
  }

  private setInitialState(): void {
    this.columns = _.cloneDeep(this.defaultColumns);
    this.hiddenColumns.clear();
    this.hiddenColumns.select(...this.columns.filter((column) => column.hidden));
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
