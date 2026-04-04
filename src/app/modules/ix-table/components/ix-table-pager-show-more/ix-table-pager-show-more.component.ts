import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, input, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-table-pager-show-more',
  templateUrl: './ix-table-pager-show-more.component.html',
  styleUrls: ['./ix-table-pager-show-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsible]': 'collapsible()',
    '[class.clickable]': '!!routerLink().length',
  },
  imports: [
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTablePagerShowMoreComponent<T> implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  dataProvider = input.required<DataProvider<T>>();
  pageSize = input(5);
  routerLink = input<string[]>([]);
  ixTestOverride = input.required<string[]>();

  currentPage = signal(1);
  totalItems = signal(0);
  expanded = signal(false);
  protected collapsible = computed(() => this.totalItems() > this.pageSize());

  dataTest(key: string): string[] {
    return [...this.ixTestOverride(), key];
  }

  ngOnInit(): void {
    this.dataProvider().setPagination({
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
    });

    this.dataProvider().currentPage$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.totalItems.set(this.dataProvider().totalRows);
      this.cdr.markForCheck();
    });
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
