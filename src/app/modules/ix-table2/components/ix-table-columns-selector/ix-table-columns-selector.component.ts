import { SelectionModel } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@UntilDestroy()
@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableColumnsSelectorComponent<T> implements OnInit {
  @Input() columns: Column<T, ColumnComponent<T>>[];
  @Output() changed = new EventEmitter();
  selectedColumns = new SelectionModel<Column<T, ColumnComponent<T>>>(true, []);

  get isAllChecked(): boolean {
    return this.selectedColumns.selected.length === this.columns.length;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.selectedColumns.changed.pipe(untilDestroyed(this)).subscribe((values) => {
      if (values.removed.length) {
        this.columns.find((column) => column.propertyName === values.removed[0].propertyName).hidden = false;
      }
      if (values.added.length) {
        this.columns.find((column) => column.propertyName === values.added[0].propertyName).hidden = true;
      }
      this.cdr.markForCheck();
      this.changed.emit();
    });
  }

  toggleAll(): void {
    if (this.isAllChecked) {
      this.columns.forEach((column) => this.selectedColumns.deselect(column));
    } else {
      this.columns.forEach((column) => this.selectedColumns.select(column));
    }
  }

  isSelected(column: Column<T, ColumnComponent<T>>): boolean {
    return this.selectedColumns.isSelected(column);
  }

  resetToDefaults(): void {
    this.columns.forEach((column) => column.hidden = false);
    this.changed.emit();
    this.selectedColumns.clear();
    this.cdr.markForCheck();
  }

  toggle(column: Column<T, ColumnComponent<T>>): void {
    this.selectedColumns.toggle(column);
    this.changed.emit();
    this.cdr.markForCheck();
  }
}
