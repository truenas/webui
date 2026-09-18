import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, input, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { scopeTestId, TnButtonComponent } from '@truenas/ui-components';
import { DataProvider } from 'app/modules/tn-table/interfaces/data-provider.interface';

@Component({
  selector: 'ix-table-pager-show-more',
  templateUrl: './table-pager-show-more.component.html',
  styleUrls: ['./table-pager-show-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsible]': 'collapsible()',
    '[class.clickable]': '!!routerLink().length',
  },
  imports: [
    TnButtonComponent,
    TranslateModule,
  ],
})
export class TablePagerShowMoreComponent<T> implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  dataProvider = input.required<DataProvider<T>>();
  pageSize = input(5);
  routerLink = input<string[]>([]);
  /**
   * Test-id base for the pager's two buttons, which scope off it as
   * `button-<base>-show-more` / `-show-less`. Named for the library's convention: it was
   * named after a directive retired in NAS-143893 until that ticket renamed it, and it never
   * was one — nothing here overrides a nested id, it supplies the base.
   */
  testId = input.required<string[]>();

  currentPage = signal(1);
  totalItems = signal(0);
  expanded = signal(false);
  protected collapsible = computed(() => this.totalItems() > this.pageSize());

  /**
   * Resolved once per `testId` change rather than per binding: a method in the template reruns
   * `scopeTestId` on every change-detection pass, which is what the rest of NAS-143893 moved out
   * of templates.
   */
  protected readonly showMoreTestId = computed(() => scopeTestId(this.testId(), 'show-more'));
  protected readonly showLessTestId = computed(() => scopeTestId(this.testId(), 'show-less'));

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
