import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ChangeDetectorRef, Input,
} from '@angular/core';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';

@Component({
  selector: 'ix-checkbox-column',
  templateUrl: './ix-checkbox-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCheckboxColumnComponent<T = unknown> implements OnInit, OnDestroy {
  @Input() dataSource: MatTableDataSource<T>;
  @Input() selection: SelectionModel<T>;
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
      this.table.removeColumnDef(this.columnDef);
    }
  }

  getPageData(): T[] {
    return this.dataSource.connect().getValue();
  }

  isPageSelected(): boolean {
    return this.selection.selected.length === this.getPageData().length;
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle(): void {
    if (this.isAllSelected() || (this.isPageSelected() && !this.isAllSelected())) {
      this.selection.clear();
      return;
    }

    console.info('getPaged', this.getPageData());

    this.selection.select(...this.getPageData());
  }

  checkboxLabel(item?: T): string {
    if (!item) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(item) ? 'deselect' : 'select'} row ${this.dataSource.filteredData.indexOf(item) + 1}`;
  }
}
