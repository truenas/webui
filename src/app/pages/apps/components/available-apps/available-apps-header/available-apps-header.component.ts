import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin, Observable, of, switchMap,
} from 'rxjs';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { Catalog, CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Option } from 'app/interfaces/option.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { catalogToAppsTransform } from 'app/pages/apps/utils/catalog-to-apps-transform';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsHeaderComponent implements OnInit {
  @Output() filters = new EventEmitter<AppsFiltersValues>();

  form = this.fb.group({
    search: [''],
    catalogs: [[] as string[]],
    sort: [''],
    categories: [[] as string[]],
  });

  catalogsOptions$: Observable<Option[]> = of([]);
  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('App Name'), value: 'name' },
    { label: this.translate.instant('Catalog Name'), value: 'catalog.id' },
    { label: this.translate.instant('Updated Date'), value: 'last_update' },
  ]);
  categoriesProvider$: ChipsProvider = () => of([]);

  isLoading = false;
  isFirstLoad = true;
  showFilters = false;
  availableApps: CatalogApp[] = [];
  installedApps: ChartRelease[] = [];
  installedCatalogs: Catalog[] = [];

  constructor(
    private appService: ApplicationsService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((filters) => {
      this.filters.emit({
        search: filters.search || '',
        catalogs: filters.catalogs || [],
        sort: filters.sort || '',
        categories: filters.categories || [],
      });
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.appService.getAllCatalogs(),
      this.appService.getChartReleases(),
    ]).pipe(
      switchMap(([catalogs, releases]) => {
        this.installedApps = releases;
        this.installedCatalogs = catalogs;
        this.catalogsOptions$ = of(catalogs.map((catalog) => ({ label: catalog.label, value: catalog.id })));

        if (this.isFirstLoad) {
          this.form.controls.catalogs.patchValue(catalogs.map((catalog) => catalog.id));
        }

        return of(catalogs);
      }),
      catalogToAppsTransform(),
      untilDestroyed(this),
    ).subscribe((apps) => {
      this.availableApps = apps;
      const categories = new Set<string>();
      apps.forEach((app) => app.categories.forEach((category) => categories.add(category)));
      this.categoriesProvider$ = (query) => of(Array.from(categories).filter((category) => category.includes(query)));

      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.form.controls.categories.patchValue([]);
      }
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }
}
