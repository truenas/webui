import {
  AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';

@UntilDestroy()
@Component({
  selector: 'ix-table-pager-show-more',
  templateUrl: './ix-table-pager-show-more.component.html',
  styleUrls: ['./ix-table-pager-show-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTablePagerShowMoreComponent<T> implements OnInit, AfterContentChecked {
  @Input() dataProvider!: DataProvider<T>;
  @Input() pageSize = 5;

  currentPage = 1;
  totalItems = 0;
  expanded = false;

  @HostBinding('class.collapsible') get collapsible(): boolean {
    return this.totalItems > this.pageSize;
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
    this.cdr.markForCheck();
  }

  showMore(): void {
    this.expanded = true;
    this.dataProvider.setPagination({
      pageNumber: this.currentPage,
      pageSize: this.totalItems,
    });
    this.cdr.markForCheck();
  }

  showLess(): void {
    this.expanded = false;
    this.dataProvider.setPagination({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
    });
    this.cdr.markForCheck();
  }
}
