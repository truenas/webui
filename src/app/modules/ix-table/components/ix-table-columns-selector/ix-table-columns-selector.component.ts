import { SelectionModel } from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, model, OnChanges, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTableColumnsSelectorComponent<T = unknown> implements OnChanges {
  readonly columns = model<Column<T, ColumnComponent<T>>[]>();

  readonly columnsChange = output<Column<T, ColumnComponent<T>>[]>();

  hiddenColumns = new SelectionModel<Column<T, ColumnComponent<T>>>(true, []);
  private defaultColumns: Column<T, ColumnComponent<T>>[];

  get isOnlyOneColumnSelected(): boolean {
    return this.columns().filter((column) => !column.hidden && !!column.title).length === 1;
  }

  get isAllSelected(): boolean {
    return !this.columns().filter((column) => column.hidden && !!column.title).length;
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
    if (this.isAllSelected) {
      this.hiddenColumns.deselect(...this.columns());
      this.toggle(this.columns()[0]);
    } else {
      this.hiddenColumns.select(...this.columns());
    }

    this.columns().forEach((_cell, index) => this.toggle(this.columns()[index]));

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
    this.columns.set(cloneDeep(this.defaultColumns));
    this.hiddenColumns.select(...this.columns());

    this.defaultColumns.forEach((column, index) => {
      if (!column.hidden) {
        this.toggle(this.columns()[index]);
      }
    });

    this.emitColumnsChange();
    this.cdr.markForCheck();
  }

  private subscribeToColumnsChange(): void {
    this.hiddenColumns.changed
      .pipe(untilDestroyed(this))
      .subscribe((values) => {
        if (values.removed.length) {
          this.columns().find((column) => column.title === values.removed[0].title).hidden = false;
        }
        if (values.added.length) {
          this.columns().find((column) => column.title === values.added[0].title).hidden = true;
        }
        this.emitColumnsChange();
        this.cdr.markForCheck();
      });
  }

  private emitColumnsChange(): void {
    this.columnsChange.emit([...this.columns()]);
  }
}
