import {
  AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';

@UntilDestroy()
@Component({
  selector: 'ix-table-pager',
  templateUrl: './ix-table-pager.component.html',
  styleUrls: ['./ix-table-pager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTablePagerComponent<T> implements OnInit, AfterContentChecked {
  @Input() dataProvider!: DataProvider<T>;
  @Input() pageSize = 50;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() currentPage = 1;

  totalItems = 0;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get firstPage(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastPage(): number {
    const lastPage = this.currentPage * this.pageSize;
    return lastPage < this.totalItems ? lastPage : this.totalItems;
  }

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataProvider.setPagination({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  ngAfterContentChecked(): void {
    this.totalItems = this.dataProvider.totalRows;
    if (this.currentPage > this.totalPages && this.currentPage !== 1) {
      this.goToPage(1);
    }
    this.cdr.markForCheck();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.dataProvider.setPagination({
        pageNumber,
        pageSize: this.pageSize,
      });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  onPageSizeChange($event: MatSelectChange): void {
    this.pageSize = $event.value as number;
    this.goToPage(1);
  }
}
