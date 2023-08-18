import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  debounceTime, distinctUntilChanged, filter, map, Observable, of, take, tap,
} from 'rxjs';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/apps/apps';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsHeaderComponent implements OnInit, AfterViewInit {
  form = this.fb.group({
    catalogs: [[] as string[]],
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

  searchControl = this.fb.control('');
  showFilters = false;
  isFirstLoad = true;
  availableApps$ = this.applicationsStore.availableApps$;
  areLoaded$ = new BehaviorSubject(false);
  installedApps$ = this.installedAppsStore.installedApps$;
  catalogs$ = this.applicationsStore.catalogs$.pipe(
    tap((catalogs) => {
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.form.controls.catalogs.patchValue(catalogs);
      }
    }),
  );
  isFilterApplied$ = this.appsFilterStore.isFilterApplied$;
  appsCategories: string[] = [];
  catalogsOptions$ = this.catalogs$.pipe(singleArrayToOptions());
  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Category'), value: null },
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Name },
    { label: this.translate.instant('Catalog Name'), value: AppsFiltersSort.Catalog },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
  ]);
  categoriesProvider$: ChipsProvider = (query: string) => this.applicationsStore.appsCategories$.pipe(
    map((categories) => {
      this.appsCategories = [...categories];
      return categories.filter((category) => category.trim().toLowerCase().includes(query.trim().toLowerCase()));
    }),
  );

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    protected applicationsStore: AppsStore,
    protected appsFilterStore: AppsFilterStore,
    protected installedAppsStore: InstalledAppsStore,
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((searchQuery) => {
      this.appsFilterStore.applySearchQuery(searchQuery);
    });
    this.appsFilterStore.filterValues$.pipe(take(1), untilDestroyed(this)).subscribe({
      next: (filterValues) => {
        if (filterValues.categories?.length) {
          this.form.controls.categories.setValue(filterValues.categories, { emitEvent: false });
        }
        if (filterValues.catalogs?.length) {
          this.form.controls.catalogs.setValue(filterValues.catalogs, { emitEvent: false });
        }
        if (filterValues.sort) {
          this.form.controls.sort.setValue(filterValues.sort, { emitEvent: false });
        }
      },
    });
    this.isFilterApplied$.pipe(untilDestroyed(this)).subscribe({
      next: (isFilterApplied) => {
        this.showFilters = this.showFilters || isFilterApplied;
        this.cdr.markForCheck();
      },
    });
    this.appsFilterStore.searchQuery$.pipe(take(1), untilDestroyed(this)).subscribe({
      next: (searchQuery) => {
        this.searchControl.setValue(searchQuery);
      },
    });
    this.applicationsStore.isLoading$.pipe(
      filter((value) => !value),
      untilDestroyed(this),
    ).subscribe(() => {
      this.areLoaded$.next(true);
    });
  }

  ngAfterViewInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.applyFilters();
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
    this.appsFilterStore.applyFilters({
      catalogs: this.form.value.catalogs || [],
      sort: this.form.value.sort || null,
      categories: (this.form.value.categories || this.appsCategories),
    });
  }
}
