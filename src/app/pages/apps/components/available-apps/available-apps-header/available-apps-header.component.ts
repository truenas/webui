import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
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

  form = this.fb.group({
    search: [''],
    catalogs: [[] as string[]],
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

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
  availableApps: AvailableApp[] = [];
  installedApps: ChartRelease[] = [];
  installedCatalogs: string[] = [];

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
        sort: filters.sort || undefined,
        categories: filters.categories || [],
      });
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.appService.getAvailableApps(),
      this.appService.getChartReleases(),
    ]).pipe(untilDestroyed(this)).subscribe(([availableApps, releases]) => {
      this.availableApps = availableApps;
      this.installedApps = releases;

      const catalogs = new Set<string>();
      availableApps.forEach((app) => catalogs.add(app.catalog));
      this.installedCatalogs = Array.from(catalogs);
      this.catalogsOptions$ = of(this.installedCatalogs.map((catalog) => ({ label: catalog, value: catalog })));

      const categories = new Set<string>();
      availableApps.forEach((app) => app.categories.forEach((category) => categories.add(category)));
      this.categoriesProvider$ = (query) => of(Array.from(categories).filter((category) => category.includes(query)));

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
}
