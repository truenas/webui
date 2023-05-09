import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime, distinctUntilChanged, map, Observable, of, repeat, shareReplay, Subject, take, tap,
} from 'rxjs';
import { singleArrayToOptions } from 'app/helpers/options.helper';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import helptext from 'app/helptext/apps/apps';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsHeaderComponent implements OnInit {
  form = this.fb.group({
    catalogs: [[] as string[]],
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

  searchControl = this.fb.control('');
  isLoading = false;
  isFirstLoad = true;
  showFilters = false;

  isFilterApplied$ = this.applicationsStore.isFilterApplied$;
  appsCategories: string[] = [];
  categoriesProvider$: ChipsProvider = (query: string) => this.applicationsStore.appsCategories$.pipe(
    map((categories) => {
      this.appsCategories = [...categories];
      return categories.filter((category) => category.trim().toLowerCase().includes(query.trim().toLowerCase()));
    }),
  );

  installedCatalogs: string[] = [];

  refreshAvailableApps$ = new Subject<boolean>();
  availableApps$ = this.applicationsStore.availableApps$.pipe(
    toLoadingState(),
    repeat({ delay: () => this.refreshAvailableApps$ }),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );
  installedCatalogs$ = this.availableApps$.pipe(
    map((state) => ({ ...state, value: [...new Set<string>(state.value?.map((app) => app.catalog))] })),
    tap(({ value: installedCatalogs }) => {
      this.installedCatalogs = installedCatalogs;
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.form.controls.catalogs.patchValue(installedCatalogs);
      }
    }),
  );
  installedApps$ = this.applicationsStore.installedApps$.pipe(
    toLoadingState(),
    repeat({ delay: () => this.refreshAvailableApps$ }),
  );
  catalogsOptions$: Observable<Option[]> = this.installedCatalogs$.pipe(
    map((state) => state.value),
    singleArrayToOptions(),
  );

  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Category'), value: null },
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Name },
    { label: this.translate.instant('Catalog Name'), value: AppsFiltersSort.Catalog },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
  ]);

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    protected applicationsStore: AvailableAppsStore,
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((searchQuery) => {
      this.applicationsStore.applySearchQuery(searchQuery);
    });
    this.applicationsStore.filterValues$.pipe(untilDestroyed(this)).subscribe({
      next: (filter) => {
        if (filter.categories?.length) {
          this.form.controls.categories.setValue(filter.categories);
        }
        if (filter.catalogs?.length) {
          this.form.controls.catalogs.setValue(filter.catalogs);
        }
        if (filter.sort) {
          this.form.controls.sort.setValue(filter.sort);
        }
      },
    });
    this.isFilterApplied$.pipe(untilDestroyed(this)).subscribe({
      next: (isFilterApplied) => {
        this.showFilters = this.showFilters || isFilterApplied;
        this.cdr.markForCheck();
      },
    });
    this.applicationsStore.searchQuery$.pipe(take(1), untilDestroyed(this)).subscribe({
      next: (searchQuery) => {
        this.searchControl.setValue(searchQuery);
      },
    });
  }

  refreshCharts(): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.applicationsStore.initialize();
      this.cdr.markForCheck();
    });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.applicationsStore.applyFilters({
      catalogs: this.form.value.catalogs || [],
      sort: this.form.value.sort || null,
      categories: (this.form.value.categories || this.appsCategories),
    });
  }

  refreshAvailableApps(): void {
    this.refreshAvailableApps$.next(true);
  }
}
