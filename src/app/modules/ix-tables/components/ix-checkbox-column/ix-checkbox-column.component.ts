import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ChangeDetectorRef,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox-column',
  templateUrl: './ix-checkbox-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCheckboxColumnComponent<T = unknown> implements OnInit, OnDestroy {
  selection: SelectionModel<T> = new SelectionModel<T>(true, [], true);
  isChecked$ = new BehaviorSubject(false);
  isIndeterminate$ = this.selection.changed.pipe(
    map((changes) => Boolean(changes.source.selected.length)),
  );
  @ViewChild(MatColumnDef, { static: false }) columnDef: MatColumnDef;

  constructor(
    private table: IxTableComponent<T>,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (this.table) {
      this.cdr.detectChanges();
      this.table.addColumnDef(this.columnDef);
    }
  }

  ngOnDestroy(): void {
    if (this.table) {
      this.cdr.detach();
      this.table.removeColumnDef(this.columnDef);
    }
  }

  getDataSource(): MatTableDataSource<T> {
    return this.table.dataSource as MatTableDataSource<T>;
  }

  getPageData(): T[] {
    return this.getDataSource().connect().getValue();
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.getDataSource().filteredData.length;
  }

  onChange(event: MatCheckboxChange): void {
    this.isChecked$.next(event.checked);
    if (event.checked) {
      this.masterToggle();
    } else {
      this.clearSelection();
    }
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      this.selection.select(...this.getPageData());
    }
  }

  clearSelection(): void {
    this.isChecked$.next(false);
    this.selection.clear();
    this.cdr.markForCheck();
  }

  checkboxLabel(item?: T): string {
    if (!item) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(item) ? 'deselect' : 'select'} row ${this.getDataSource().filteredData.indexOf(item) + 1}`;
  }
}
