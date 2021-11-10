import {
  Component, Input, ViewChild,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'ix-table-paginator',
  templateUrl: './ix-table-paginator.component.html',
  styleUrls: ['./ix-table-paginator.component.scss'],
})
export class IxTablePaginatorComponent<T> {
  @Input() dataSource: MatTableDataSource<T>;
  @Input() pageSize = 50;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() showFirstLastButtons = true;
  @Input() hidePageSize = false;
  @ViewChild(MatPaginator, { static: false }) set matPaginator(paginator: MatPaginator) {
    if (this.dataSource) {
      this.dataSource.paginator = paginator;
    }
  }

  get total(): number {
    return this.dataSource.data.length || 0;
  }

  onPageChanged(event: PageEvent): void {
    console.info('pageChanged', event);
  }
}
