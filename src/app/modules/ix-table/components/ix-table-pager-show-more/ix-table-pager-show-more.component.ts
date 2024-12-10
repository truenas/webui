import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, HostBinding, input, OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-table-pager-show-more',
  templateUrl: './ix-table-pager-show-more.component.html',
  styleUrls: ['./ix-table-pager-show-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTablePagerShowMoreComponent<T> implements OnInit, AfterContentChecked {
  dataProvider = input.required<DataProvider<T>>();
  pageSize = input(5);
  routerLink = input<string[]>([]);
  ixTestOverride = input.required<string[]>();

  currentPage = signal(1);
  totalItems = signal(0);
  expanded = signal(false);

  @HostBinding('class.collapsible') get collapsible(): boolean {
    return this.totalItems() > this.pageSize();
  }

  @HostBinding('class.clickable') get clickable(): boolean {
    return Boolean(this.routerLink().length);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  dataTest(key: string): string[] {
    return [...this.ixTestOverride(), key];
  }

  ngOnInit(): void {
    this.dataProvider().setPagination({
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
    });
  }

  ngAfterContentChecked(): void {
    this.totalItems.set(this.dataProvider().totalRows);
    this.cdr.markForCheck();
  }

  showMore(): void {
    this.handleRouterLink();

    this.expanded.set(true);
    this.dataProvider().setPagination({
      pageNumber: this.currentPage(),
      pageSize: this.totalItems(),
    });
    this.cdr.markForCheck();
  }

  showLess(): void {
    this.expanded.set(false);
    this.dataProvider().setPagination({
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
    });
    this.cdr.markForCheck();
  }

  private handleRouterLink(): void {
    const hasLink = this.routerLink();
    if (hasLink) {
      this.router.navigate(hasLink);
    }
  }
}
