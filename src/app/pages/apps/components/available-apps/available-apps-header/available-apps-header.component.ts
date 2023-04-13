import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime, distinctUntilChanged, map, Observable, of, repeat, shareReplay, Subject, tap,
} from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsHeaderComponent implements OnInit {
  @Output() filters = new EventEmitter<AppsFiltersValues>();
  @Output() search = new EventEmitter<string>();

  form = this.fb.group({
    catalogs: [[] as string[]],
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

  searchControl = this.fb.control('');
  isLoading = false;
  isFirstLoad = true;
  showFilters = false;
  @Input() appliedFilters = false;

  installedCatalogs: string[] = [];

  refreshAvailableApps$ = new Subject<boolean>();
  availableApps$ = this.appService.getAvailableApps().pipe(
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
  catalogsOptions$: Observable<Option[]> = this.installedCatalogs$.pipe(
    map((state) => state.value.map((catalog) => ({ label: catalog, value: catalog }))),
  );
  installedApps$ = this.appService.getChartReleases().pipe(
    toLoadingState(),
    repeat({ delay: () => this.refreshAvailableApps$ }),
  );
  categoriesProvider$: ChipsProvider = (query) => this.appService.getAllAppsCategories().pipe(
    map((categories) => {
      categories.unshift(AppExtraCategory.NewAndUpdated, AppExtraCategory.Recommended);
      return categories.filter((category) => category.includes(query));
    }),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );
  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Name },
    { label: this.translate.instant('Catalog Name'), value: AppsFiltersSort.Catalog },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
  ]);

  constructor(
    private appService: ApplicationsService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((searchQuery) => {
      this.search.emit(searchQuery);
    });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.filters.emit({
      catalogs: this.form.value.catalogs || [],
      sort: this.form.value.sort || undefined,
      categories: this.form.value.categories.map(
        (category) => {
          if (category === AppExtraCategory.NewAndUpdated) {
            return 'latest';
          }
          if (category === AppExtraCategory.Recommended) {
            return 'recommended';
          }
          return category;
        },
      ),
    });
    this.appliedFilters = true;
  }

  resetFilters(): void {
    this.form.reset();
    this.form.controls.catalogs.setValue(this.installedCatalogs);
    this.form.controls.categories.setValue([]);
    this.filters.emit(undefined);
    this.appliedFilters = false;
  }

  refreshAvailableApps(): void {
    this.refreshAvailableApps$.next(true);
  }
}
