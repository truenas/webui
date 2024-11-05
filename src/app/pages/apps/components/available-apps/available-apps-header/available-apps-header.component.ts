import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  BehaviorSubject,
  debounceTime, distinctUntilChanged, filter, map, Observable, of, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FilterSelectListComponent } from 'app/pages/apps/components/filter-select-list/filter-select-list.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    MatButton,
    MatAnchor,
    IxChipsComponent,
    IxIconComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
    AsyncPipe,
    TestDirective,
    RequiresRolesDirective,
    FilterSelectListComponent,
    RouterLink,
  ],
})
export class AvailableAppsHeaderComponent implements OnInit, AfterViewInit {
  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  form = this.fb.group({
    sort: [null as AppsFiltersSort],
    categories: [[] as string[]],
  });

  searchControl = this.fb.control('');
  showFilters = false;
  availableApps$ = this.applicationsStore.availableApps$;
  areLoaded$ = new BehaviorSubject(false);
  installedApps$ = this.installedAppsStore.installedApps$;
  isFilterApplied$ = this.appsFilterStore.isFilterApplied$;
  appsCategories: string[] = [];
  sortOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Category'), value: null },
    { label: this.translate.instant('App Name'), value: AppsFiltersSort.Name },
    { label: this.translate.instant('Updated Date'), value: AppsFiltersSort.LastUpdate },
  ]);

  categoriesProvider$: ChipsProvider = (query: string) => this.applicationsStore.appsCategories$.pipe(
    map((categories) => {
      this.appsCategories = [...categories];
      return categories.filter((category) => category.trim().toLowerCase().includes(query.trim().toLowerCase()));
    }),
  );

  readonly AppExtraCategory = AppExtraCategory;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    protected applicationsStore: AppsStore,
    protected appsFilterStore: AppsFilterStore,
    protected installedAppsStore: InstalledAppsStore,
    private errorHandler: ErrorHandlerService,
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

  refreshCatalog(): void {
    this.dialogService.jobDialog(
      this.ws.job('catalog.sync'),
      {
        title: this.translate.instant(helptextApps.refreshing),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.applicationsStore.initialize();
        this.cdr.markForCheck();
      });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.appsFilterStore.applyFilters({
      sort: this.form.value.sort || null,
      categories: this.form.value.categories || this.appsCategories,
    });
  }

  protected readonly iconMarker = iconMarker;
}
