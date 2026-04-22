import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, input, model, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatSelectChange, MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { skip } from 'rxjs';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-table-pager',
  templateUrl: './ix-table-pager.component.html',
  styleUrls: ['./ix-table-pager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    MatIconButton,
    TnIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTablePagerComponent<T> implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private syncing = false;

  readonly dataProvider = input.required<DataProvider<T>>();
  readonly pageSize = model(50);
  readonly pageSizeOptions = input([10, 20, 50, 100]);
  readonly currentPage = model(1);

  protected totalItems = signal(0);

  protected totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.pageSize());
  });

  protected firstPage = computed(() => {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  protected lastPage = computed(() => {
    const lastPage = this.currentPage() * this.pageSize();
    return lastPage < this.totalItems() ? lastPage : this.totalItems();
  });

  ngOnInit(): void {
    this.dataProvider().setPagination({
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
    });
    this.totalItems.set(this.dataProvider().totalRows);

    // Skip the BehaviorSubject replay (which holds the value from setPagination above)
    // to avoid an unnecessary initial sync.
    this.dataProvider().currentPage$.pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.syncWithDataProvider();
    });
  }

  private syncWithDataProvider(): void {
    if (this.syncing) {
      return;
    }

    this.totalItems.set(this.dataProvider().totalRows);
    const providerPage = this.dataProvider().pagination.pageNumber;
    if (providerPage !== null && providerPage !== this.currentPage()) {
      // Set directly instead of goToPage to avoid calling setPagination back on the provider.
      this.currentPage.set(providerPage);
    } else if (this.currentPage() > this.totalPages() && this.currentPage() !== 1) {
      // Use a guard flag to break the feedback loop
      // (setPagination → updateCurrentPage → currentPage$.next → syncWithDataProvider again).
      this.syncing = true;
      this.currentPage.set(1);
      this.dataProvider().setPagination({
        pageNumber: 1,
        pageSize: this.pageSize(),
      });
      this.syncing = false;
    }
    this.cdr.markForCheck();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.currentPage.set(pageNumber);
      this.dataProvider().setPagination({
        pageNumber,
        pageSize: this.pageSize(),
      });
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  onPageSizeChange($event: MatSelectChange): void {
    this.pageSize.set($event.value as number);
    this.goToPage(1);
  }
}
