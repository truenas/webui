import { AfterContentChecked, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

@UntilDestroy()
@Component({
  selector: 'ix-table-pager',
  templateUrl: './ix-table-pager.component.html',
  styleUrls: ['./ix-table-pager.component.scss'],
})
export class IxTablePagerComponent<T> implements AfterContentChecked {
  @Input() dataProvider!: ArrayDataProvider<T>;
  @Input() itemsPerPage = 10;

  currentPage = 1;
  totalItems = 0;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get firstPage(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get lastPage(): number {
    const lastPage = this.currentPage * this.itemsPerPage;
    return lastPage < this.totalItems ? lastPage : this.totalItems;
  }

  ngAfterContentChecked(): void {
    this.dataProvider.rows$.pipe(untilDestroyed(this)).subscribe((row) => {
      this.totalItems = row.length;
      if (this.currentPage > this.totalPages && this.currentPage !== 1) {
        this.goToPage(1);
      }
    });
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.dataProvider.setPagination({
        pageNumber,
        pageSize: this.itemsPerPage,
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
}
