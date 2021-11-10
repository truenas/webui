import {
  Component, ChangeDetectionStrategy, ViewChild, Input,
  ContentChild, ContentChildren, QueryList, AfterContentInit, ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  MatColumnDef, MatHeaderRowDef, MatNoDataRow, MatRowDef, MatTable, MatTableDataSource,
} from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { IxTableService } from 'app/pages/common/ix-tables/services/ix-table.service';

@UntilDestroy()
@Component({
  selector: 'ix-table',
  templateUrl: './ix-table.component.html',
  styleUrls: ['./ix-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IxTableService],
})
export class IxTableComponent<T> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow: MatNoDataRow;
  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  @Input() dataSource: MatTableDataSource<T>;
  @Input() error$: Observable<boolean>;
  @Input() title: string;
  @Input() multiTemplateDataRows: boolean;

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  update(): void {
    this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach((rowDef) => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach((headerRowDef) => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.noDataRow);
    this.cdr.markForCheck();
  }

  ngAfterContentInit(): void {
    this.update();
  }
}
