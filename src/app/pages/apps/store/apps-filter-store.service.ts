import { computed, inject, Injectable } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { deburr, some, toLower } from 'lodash-es';
import {
  Observable, map, pipe, switchMap,
} from 'rxjs';
import { AppExtraCategory, appExtraCategoryLabels } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsByCategory, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export const filterInitialValues: AppsFiltersValues = {
  categories: [],
  sort: null,
};

export interface AppsFilterState {
  filteredApps: AvailableApp[];
  filter: AppsFiltersValues;
  isLoading: boolean;
  isFilterApplied: boolean;
  searchQuery: string;
}

const initialState: AppsFilterState = {
  filteredApps: [],
  isLoading: false,
  isFilterApplied: false,
  filter: filterInitialValues,
  searchQuery: '',
};

@Injectable()
export class AppsFilterStore {
  private appsStore = inject(AppsStore);
  private appsService = inject(ApplicationsService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  readonly appsPerCategory = 6;

  private readonly state = signalState(initialState);

  readonly filteredApps = this.state.filteredApps;
  readonly isFiltering = this.state.isLoading;
  readonly isFilterApplied = this.state.isFilterApplied;
  readonly searchQuery = this.state.searchQuery;
  readonly filterValues = this.state.filter;

  readonly searchedApps = computed<AppsByCategory[]>(() => {
    const searchQuery = this.searchQuery();
    const filterValues = this.filterValues();
    const stateFilteredApps = this.filteredApps();
    const allApps: AvailableApp[] = stateFilteredApps.length
      ? [...stateFilteredApps]
      : [...this.appsStore.availableApps()];
    const filteredApps: AvailableApp[] = allApps
      .filter((app) => this.doesAppContainString(searchQuery, app))
      .sort(this.sortAppsByTitleAndSearchQuery);

    if (filterValues.sort === AppsFiltersSort.Title) {
      return this.sortAppsByTitle(filteredApps);
    }
    if (filterValues.sort === AppsFiltersSort.LastUpdate) {
      return this.sortAppsByLastUpdate(filteredApps);
    }
    if (filterValues.sort === AppsFiltersSort.PopularityRank) {
      return this.sortAppsByPopularityRank(filteredApps);
    }

    return this.sortAppsByCategory(
      filteredApps,
      searchQuery.length ? [] : this.appsStore.recommendedApps(),
      searchQuery.length ? [] : this.appsStore.latestApps(),
      this.appsStore.appsCategories(),
      filterValues.categories || [],
    );
  });

  readonly appsByCategories = computed<AppsByCategory[]>(() => {
    return this.sortAppsByCategory(
      this.appsStore.availableApps(),
      this.appsStore.recommendedApps(),
      this.appsStore.latestApps(),
      this.appsStore.appsCategories(),
      this.filterValues().categories || [],
    );
  });

  /**
   * The apps a category view shows: the server-filtered list narrowed down by the search query.
   * Unlike {@link searchedApps} it stays a flat list, because a category view renders one grid.
   */
  readonly searchedFilteredApps = computed<AvailableApp[]>(() => {
    const filteredApps = this.filteredApps();
    const searchQuery = this.searchQuery();
    if (!searchQuery) {
      return filteredApps;
    }

    return filteredApps
      .filter((app) => this.doesAppContainString(searchQuery, app))
      .sort(this.sortAppsByTitleAndSearchQuery);
  });

  readonly applyFilters = rxMethod<AppsFiltersValues>(pipe(
    switchMap((filter) => {
      patchState(this.state, { isLoading: true });

      return this.requestFilteredApps(filter).pipe(
        tapResponse({
          next: (filteredApps) => {
            patchState(this.state, {
              filter,
              filteredApps,
              isFilterApplied: true,
            });
          },
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));

  resetFilters(): void {
    patchState(this.state, {
      isFilterApplied: false,
      searchQuery: '',
      filteredApps: [],
      filter: filterInitialValues,
    });
  }

  /**
   * Drops the category/sort filters but keeps the search query, so that it survives the trip
   * between the Discover page and a category view in either direction.
   */
  resetFiltersKeepingSearch(): void {
    patchState(this.state, {
      isFilterApplied: false,
      filteredApps: [],
      filter: filterInitialValues,
    });
  }

  applySearchQuery(searchQuery: string): void {
    patchState(this.state, { searchQuery });
  }

  private requestFilteredApps(filter: AppsFiltersValues): Observable<AvailableApp[]> {
    let request$: Observable<AvailableApp[]> = this.appsService.getAvailableApps({
      ...filter,
      categories: filter.categories?.filter((category) => !category.includes(AppExtraCategory.Recommended)) || [],
    });

    if (filter.categories?.some((category) => category.includes(AppExtraCategory.NewAndUpdated))) {
      request$ = this.appsService.getLatestApps({
        ...filter,
        categories: filter.categories.filter((category) => !category.includes(AppExtraCategory.NewAndUpdated)),
      });
    }

    if (filter.categories?.some((category) => category.includes(AppExtraCategory.All))) {
      request$ = this.appsService.getLatestApps({
        ...filter,
        sort: AppsFiltersSort.Title,
        categories: undefined,
      });
    }

    if (!filter.categories?.some((category) => category.includes(AppExtraCategory.Recommended))) {
      return request$;
    }

    return request$.pipe(
      map((filteredApps) => [
        ...filteredApps,
        ...filteredApps
          .filter((app) => app.recommended)
          .map((app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] })),
      ]),
    );
  }

  private doesAppContainString = (searchQuery: string, app: AvailableApp): boolean => {
    const normalize = (str: string): string => toLower(deburr(str));
    const isStringsArray = (arr: unknown[]): boolean => arr.every((i) => typeof i === 'string');
    const search = normalize(searchQuery);
    return some(app, (value) => {
      if (typeof value === 'string') {
        return normalize(value).includes(search);
      }
      if (Array.isArray(value) && isStringsArray(value)) {
        return value.some((indexVal) => (typeof indexVal === 'string' ? normalize(indexVal).includes(search) : false));
      }
      return false;
    });
  };

  private sortAppsByTitle(filteredApps: AvailableApp[]): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const firstLetters = [
      ...new Set<string>(filteredApps.map((app) => app.title.slice(0, 1).toUpperCase())),
    ].sort((a, b) => a.localeCompare(b));

    firstLetters.forEach((firstLetter) => {
      const appsSortedByFirstLetter = filteredApps.filter(
        (app) => app.title.toUpperCase().startsWith(firstLetter),
      );

      appsByCategory.push({
        title: firstLetter,
        apps: appsSortedByFirstLetter,
        totalApps: appsSortedByFirstLetter.length,
        category: firstLetter,
      });
    });

    return appsByCategory;
  }

  private sortAppsByLastUpdate(filteredApps: AvailableApp[]): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const updateDates = [...new Set<string>(filteredApps.map(
      (app) => this.appsService.convertDateToRelativeDate(new Date(app.last_update?.$date)),
    ))];

    updateDates.forEach((updateDate) => {
      const appsSortedByLastUpdateDate = filteredApps.filter(
        (app) => this.appsService.convertDateToRelativeDate(new Date(app.last_update?.$date)) === updateDate,
      ).sort(this.sortAppsByTitleAndSearchQuery);

      appsByCategory.push({
        title: updateDate.toString(),
        apps: appsSortedByLastUpdateDate,
        totalApps: appsSortedByLastUpdateDate.length,
        category: updateDate.toString(),
      });
    });

    return appsByCategory;
  }

  private sortAppsByPopularityRank(filteredApps: AvailableApp[]): AppsByCategory[] {
    const sortedApps = [...filteredApps].sort((a, b) => {
      return (b.popularity_rank ?? -Infinity) - (a.popularity_rank ?? -Infinity);
    });

    return [{
      title: this.translate.instant('Most Popular'),
      apps: sortedApps,
      totalApps: sortedApps.length,
      category: this.translate.instant('Most Popular'),
    }];
  }

  private sortAppsByCategory(
    filteredApps: AvailableApp[],
    recommendedApps: AvailableApp[],
    latestApps: AvailableApp[],
    categories: string[],
    categoriesFilter: string[],
  ): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const hasCategoriesFilter = categoriesFilter.length > 0;

    const availableCategories = hasCategoriesFilter
      ? categories.filter((category) => categoriesFilter.includes(category))
      : categories;

    const filterAppsByTitleAndTrain = (apps: AvailableApp[]): AvailableApp[] => apps.filter((app) => {
      return filteredApps.some((filteredApp) => filteredApp.train === app.train && filteredApp.title === app.title);
    });

    const filteredRecommendedApps = filterAppsByTitleAndTrain(recommendedApps).map(
      (app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] }),
    );
    const filteredLatestApps = filterAppsByTitleAndTrain(latestApps).map(
      (app) => ({ ...app, categories: [...app.categories, AppExtraCategory.NewAndUpdated] }),
    );

    if (categoriesFilter.includes(AppExtraCategory.NewAndUpdated) || !hasCategoriesFilter) {
      appsByCategory.push({
        title: this.translate.instant(
          appExtraCategoryLabels.get(AppExtraCategory.NewAndUpdated) || AppExtraCategory.NewAndUpdated,
        ),
        apps: hasCategoriesFilter ? filteredLatestApps : filteredLatestApps.slice(0, this.appsPerCategory),
        totalApps: filteredLatestApps.length,
        category: AppExtraCategory.NewAndUpdated,
      });
    }

    if (categoriesFilter.includes(AppExtraCategory.Recommended) || !hasCategoriesFilter) {
      appsByCategory.push({
        title: this.translate.instant(
          appExtraCategoryLabels.get(AppExtraCategory.Recommended) || AppExtraCategory.Recommended,
        ),
        apps: hasCategoriesFilter ? filteredRecommendedApps : filteredRecommendedApps.slice(0, this.appsPerCategory),
        totalApps: filteredRecommendedApps.length,
        category: AppExtraCategory.Recommended,
      });
    }

    availableCategories.forEach((category) => {
      const categorizedApps = filteredApps.filter(
        (app) => app.categories.some((appCategory) => appCategory === category),
      ).sort(this.sortAppsByTitleAndSearchQuery);

      appsByCategory.push({
        title: category,
        apps: hasCategoriesFilter ? categorizedApps : categorizedApps.slice(0, this.appsPerCategory),
        totalApps: categorizedApps.length,
        category,
      });
    });

    return appsByCategory;
  }

  private sortAppsByTitleAndSearchQuery = (a: AvailableApp, b: AvailableApp): number => {
    const searchQuery = this.state.searchQuery().toLocaleLowerCase();
    const aStartsWithQuery = a.title.toLocaleLowerCase().startsWith(searchQuery);
    const bStartsWithQuery = b.title.toLocaleLowerCase().startsWith(searchQuery);

    if (aStartsWithQuery && !bStartsWithQuery) {
      return -1;
    }
    if (!aStartsWithQuery && bStartsWithQuery) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  };
}
