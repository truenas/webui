import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, linkedSignal, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnChipInputComponent, TnFormFieldComponent, TnIconComponent, TnInputComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  debounceTime, distinctUntilChanged, Observable, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilterSelectListComponent } from 'app/pages/apps/components/filter-select-list/filter-select-list.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnInputComponent,
    TnButtonComponent,
    TnIconComponent,
    TnChipInputComponent,
    TnFormFieldComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
    AsyncPipe,
    TnTestIdDirective,
    RequiresRolesDirective,
    FilterSelectListComponent,
    RouterLink,
  ],
})
export class AvailableAppsHeaderComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  protected applicationsStore = inject(AppsStore);
  protected appsFilterStore = inject(AppsFilterStore);
  protected installedAppsStore = inject(InstalledAppsStore);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  form = this.fb.group({
    sort: [null as (AppsFiltersSort | null)],
    categories: [[] as string[]],
  });

  searchControl = this.fb.control('');

  /** Opens by itself once a filter is applied, and stays open until the user closes it. */
  protected readonly showFilters = linkedSignal<boolean, boolean>({
    source: this.appsFilterStore.isFilterApplied,
    computation: (isFilterApplied, previous) => !!previous?.value || isFilterApplied,
  });

  /** Latches on the first finished catalog load, so that a later refresh keeps the counts on screen. */
  protected readonly areLoaded = linkedSignal<boolean, boolean>({
    source: this.applicationsStore.isLoading,
    computation: (isLoading, previous) => !!previous?.value || !isLoading,
  });

  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Category'), value: null },
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Title },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
    { label: this.translate.instant('Popularity'), value: AppsFiltersSort.PopularityRank },
  ]);

  readonly AppExtraCategory = AppExtraCategory;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((searchQuery) => {
      this.appsFilterStore.applySearchQuery(searchQuery || '');
    });
    const filterValues = this.appsFilterStore.filterValues();
    if (filterValues.categories?.length) {
      this.form.controls.categories.setValue(filterValues.categories, { emitEvent: false });
    }
    if (filterValues.sort) {
      this.form.controls.sort.setValue(filterValues.sort, { emitEvent: false });
    }
    this.searchControl.setValue(this.appsFilterStore.searchQuery());
  }

  ngAfterViewInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  refreshCatalog(): void {
    this.dialogService.jobDialog(
      this.api.job('catalog.sync'),
      {
        title: this.translate.instant(helptextApps.refreshing),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.applicationsStore.initialize();
        this.installedAppsStore.initialize();
        this.cdr.markForCheck();
      });
  }

  changeFiltersVisible(): void {
    this.showFilters.update((showFilters) => !showFilters);
  }

  applyFilters(): void {
    this.appsFilterStore.applyFilters({
      sort: this.form.value.sort || null,
      categories: this.form.value.categories || this.applicationsStore.appsCategories(),
    });
  }

  protected readonly tnIconMarker = tnIconMarker;
}
