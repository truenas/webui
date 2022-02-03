import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ChangeDetectorRef, Input,
} from '@angular/core';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';

@Component({
  selector: 'ix-checkbox-column',
  templateUrl: './ix-checkbox-column.component.html',
  styleUrls: ['./ix-checkbox-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCheckboxColumnComponent<T> implements OnInit, OnDestroy {
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
    return this.dataSource._pageData(this.dataSource._orderData(this.dataSource.filteredData));
  }

  isPageSelected(): boolean {
    return this.selection.selected.length === this.getPageData().length;
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle(): void {
    if (this.isAllSelected() || this.isPageSelected() && !this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.getPageData());
  }
}
