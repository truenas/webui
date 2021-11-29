import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, Input, ViewChild,
} from '@angular/core';
import {
  MatPaginator, MatPaginatorIntl,
} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ix-table-paginator',
  templateUrl: './ix-table-paginator.component.html',
  styleUrls: ['./ix-table-paginator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTablePaginatorComponent<T> extends MatPaginator {
  private _dataSource: MatTableDataSource<T>;
  @Input() set dataSource(dataSource: MatTableDataSource<T>) {
    this._dataSource = dataSource;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    this.cdr.markForCheck();
  }
  get dataSource(): MatTableDataSource<T> {
    return this._dataSource;
  }

  private _paginator: MatPaginator;
  @ViewChild(MatPaginator, { static: false }) set matPaginator(paginator: MatPaginator) {
    this._paginator = paginator;
    if (this.dataSource) {
      this.dataSource.paginator = paginator;
      this.cdr.markForCheck();
    }
  }
  get paginator(): MatPaginator {
    return this._paginator;
  }

  get total(): number {
    return this.dataSource?.data.length || 0;
  }

  constructor(
    private matPaginatorIntl: MatPaginatorIntl,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {
    super(matPaginatorIntl, cdr, {
      pageSize: 50,
      pageSizeOptions: [10, 20, 50, 100],
      hidePageSize: false,
      showFirstLastButtons: true,
    });
  }
}
