import {
  Component, ChangeDetectionStrategy, ViewChild, Input,
  ContentChild, ContentChildren, QueryList, AfterContentInit, ChangeDetectorRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  MatColumnDef, MatHeaderRowDef, MatNoDataRow, MatRowDef, MatTable, MatTableDataSource,
} from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { IxTableService } from 'app/pages/common/ix-tables/services/ix-table.service';
import { EntityTableColumn } from '../../../entity/entity-table/entity-table.interface';

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
  @Input() loading: boolean;
  /**
   * Columns are needed only when you want the default table view
   * otherwise it is optional
   */
  @Input() columns: EntityTableColumn[] = [];

  emptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No Data'),
    large: true,
  };

  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    title: this.translate.instant('Loading...'),
    large: true,
  };

  get displayedColumns(): string[] {
    return this.columns
      .filter((column) => !column.hidden)
      .map((column) => column.prop);
  }

  filterSubject = new Subject<string>();

  constructor(
    private tableService: IxTableService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {
    this.filterSubject.pipe(
      untilDestroyed(this),
    ).subscribe((query: string) => {
      this.dataSource.filter = query;
    });
  }

  update(): void {
    if (this.columnDefs.length) {
      this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
    }
    if (this.rowDefs.length) {
      this.rowDefs.forEach((rowDef) => this.table.addRowDef(rowDef));
    }
    if (this.headerRowDefs.length) {
      this.headerRowDefs.forEach((headerRowDef) => this.table.addHeaderRowDef(headerRowDef));
    }
    if (this.noDataRow) {
      this.table.setNoDataRow(this.noDataRow);
    }
    this.cdr.markForCheck();
  }

  ngAfterContentInit(): void {
    this.update();
  }

  resetFilter(): void {
    this.filterSubject.next('');
  }
}
