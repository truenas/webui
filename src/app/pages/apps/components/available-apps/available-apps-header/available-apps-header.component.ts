import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime, distinctUntilChanged, forkJoin, Observable, of,
} from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
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

  catalogsOptions$: Observable<Option[]> = of([]);
  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Name },
    { label: this.translate.instant('Catalog Name'), value: AppsFiltersSort.Catalog },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
  ]);
  categoriesProvider$: ChipsProvider = () => of([]);

  isLoading = false;
  isFirstLoad = true;
  showFilters = false;
  appliedFilters = false;
  availableApps: AvailableApp[] = [];
  installedApps: ChartRelease[] = [];
  installedCatalogs: string[] = [];
  appsCategories: string[] = [];

  constructor(
    private appService: ApplicationsService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((searchQuery) => {
      this.search.emit(searchQuery);
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.appService.getAvailableApps(),
      this.appService.getChartReleases(),
      this.appService.getAllAppsCategories(),
    ]).pipe(untilDestroyed(this)).subscribe(([availableApps, releases, categories]) => {
      this.availableApps = availableApps;
      this.installedApps = releases;

      const catalogs = new Set<string>();
      availableApps.forEach((app) => catalogs.add(app.catalog));
      this.installedCatalogs = Array.from(catalogs);
      this.catalogsOptions$ = of(this.installedCatalogs.map((catalog) => ({ label: catalog, value: catalog })));

      categories.unshift(AppExtraCategory.NewAndUpdated, AppExtraCategory.Recommended);
      this.appsCategories = categories;
      this.categoriesProvider$ = (query) => of(categories.filter((category) => category.includes(query)));

      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.form.controls.catalogs.patchValue(this.installedCatalogs);
      }
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.filters.emit({
      catalogs: this.form.value.catalogs || [],
      sort: this.form.value.sort || undefined,
      categories: this.form.value.categories || this.appsCategories,
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
}
