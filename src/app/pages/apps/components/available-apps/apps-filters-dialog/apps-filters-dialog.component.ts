import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

export interface AppsFiltersDialogData {
  sort: AppsFiltersSort | null;
  categories: string[];
  appsFilterStore?: AppsFilterStore;
}

export interface AppsFiltersDialogResult {
  sort: AppsFiltersSort | null;
  categories: string[];
}

@Component({
  selector: 'ix-apps-filters-dialog',
  templateUrl: './apps-filters-dialog.component.html',
  styleUrls: ['./apps-filters-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogTitle,
    MatButton,
    TranslateModule,
    IxChipsComponent,
    IxFieldsetComponent,
    IxCheckboxComponent,
    TestDirective,
  ],
})
export class AppsFiltersDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<AppsFiltersDialogComponent, AppsFiltersDialogResult>>(MatDialogRef);
  private translate = inject(TranslateService);
  private appsFilterStore = inject(AppsFilterStore, { optional: true });
  private applicationsStore = inject(AppsStore);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected data = inject<AppsFiltersDialogData>(MAT_DIALOG_DATA);

  form = this.fb.group({
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

  appsCategories: string[] = [];

  readonly AppsFiltersSort = AppsFiltersSort;

  sortOptions: Option[] = [
    { label: this.translate.instant('Category'), value: null },
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Title },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
    { label: this.translate.instant('Popularity'), value: AppsFiltersSort.PopularityRank },
  ];

  categoriesProvider$ = (): Observable<string[]> => this.applicationsStore.appsCategories$;

  setSort(value: unknown): void {
    this.form.patchValue({ sort: value as AppsFiltersSort });
  }

  onSubmit(): void {
    this.applyFilters();
    this.dialogRef.close();
  }

  ngOnInit(): void {
    if (!this.appsFilterStore && this.data.appsFilterStore) {
      this.appsFilterStore = this.data.appsFilterStore;
    }

    this.cdr.markForCheck();
    this.form.patchValue({
      sort: this.data.sort,
      categories: this.data.categories,
    });

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.applyFilters();
    });

    this.applicationsStore.appsCategories$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((categories) => {
      this.appsCategories = [...categories];
      this.cdr.markForCheck();
    });
  }

  applyFilters(): void {
    this.appsFilterStore?.applyFilters({
      sort: this.form.value.sort || null,
      categories: this.form.value.categories || this.appsCategories,
    });
  }

  onClose(): void {
    this.dialogRef.close({
      sort: this.form.value.sort || null,
      categories: this.form.value.categories || [],
    });
  }
}
