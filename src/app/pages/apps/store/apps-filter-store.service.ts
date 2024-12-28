import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { deburr, some, toLower } from 'lodash-es';
import {
  EMPTY, Observable, combineLatest, map,
} from 'rxjs';
import { AppExtraCategory, appExtraCategoryLabels } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsByCategory, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

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

@UntilDestroy()
@Injectable()
export class AppsFilterStore extends ComponentStore<AppsFilterState> {
  readonly appsPerCategory = 6;

  readonly filteredApps$ = this.select((state) => state.filteredApps);
  readonly isFiltering$ = this.select((state) => state.isLoading);

  readonly searchedApps$: Observable<AppsByCategory[]> = combineLatest([
    this.appsStore.availableApps$,
    this.appsStore.appsCategories$,
    this.appsStore.recommendedApps$,
    this.appsStore.latestApps$,
    this.state$,
  ]).pipe(
    map(([
      availableApps,
      appsCategories,
      recommendedApps,
      latestApps,
      state,
    ]) => {
      const allApps: AvailableApp[] = state.filteredApps?.length ? [...state.filteredApps] : [...availableApps];
      const filteredApps: AvailableApp[] = allApps
        .filter((app) => this.doesAppContainString(state.searchQuery, app))
        .sort(this.sortAppsByNameAndSearchQuery);

      if (state.filter.sort === AppsFiltersSort.Name) {
        return this.sortAppsByName(filteredApps);
      }
      if (state.filter.sort === AppsFiltersSort.LastUpdate) {
        return this.sortAppsByLastUpdate(filteredApps);
      }
      return this.sortAppsByCategory(
        filteredApps,
        state.searchQuery.length ? [] : recommendedApps,
        state.searchQuery.length ? [] : latestApps,
        appsCategories,
        state.filter.categories,
      );
    }),
  );

  readonly appsByCategories$: Observable<AppsByCategory[]> = combineLatest([
    this.appsStore.availableApps$,
    this.appsStore.appsCategories$,
    this.appsStore.recommendedApps$,
    this.appsStore.latestApps$,
    this.state$,
  ]).pipe(
    map(([
      availableApps,
      appsCategories,
      recommendedApps,
      latestApps,
      state,
    ]) => {
      return this.sortAppsByCategory(
        availableApps,
        recommendedApps,
        latestApps,
        appsCategories,
        state.filter.categories,
      );
    }),
  );

  resetFilters = this.updater((state: AppsFilterState): AppsFilterState => {
    return {
      ...state,
      isFilterApplied: false,
      searchQuery: '',
      filteredApps: [],
      filter: filterInitialValues,
    };
  });

  applySearchQuery = this.updater((state: AppsFilterState, searchQuery: string): AppsFilterState => {
    return {
      ...state,
      searchQuery,
    };
  });

  readonly isFilterApplied$ = this.select((state) => state.isFilterApplied);

  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly filterValues$ = this.select((state) => state.filter);

  constructor(
    private appsStore: AppsStore,
    private appsService: ApplicationsService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  applyFilters(filter: AppsFiltersValues): void {
    this.patchState((state) => {
      return {
        ...state,
        isLoading: true,
      };
    });

    let request$: Observable<AvailableApp[]> = this.appsService.getAvailableApps({
      ...filter,
      categories: filter.categories.filter((category) => !category.includes(AppExtraCategory.Recommended)),
    });

    if (filter.categories.some((category) => category.includes(AppExtraCategory.NewAndUpdated))) {
      request$ = this.appsService.getLatestApps({
        ...filter,
        categories: filter.categories.filter((category) => !category.includes(AppExtraCategory.NewAndUpdated)),
      });
    }

    if (filter.categories.some((category) => category.includes(AppExtraCategory.All))) {
      request$ = this.appsService.getLatestApps({
        ...filter,
        sort: AppsFiltersSort.Name,
        categories: undefined,
      });
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (filteredApps) => {
        this.patchState((state: AppsFilterState): AppsFilterState => {
          if (filter.categories.some((category) => category.includes(AppExtraCategory.Recommended))) {
            filteredApps = [
              ...filteredApps,
              ...filteredApps.filter(
                (app) => app.recommended,
              ).map(
                (app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] }),
              ),
            ];
          }

          return {
            ...state,
            filter,
            filteredApps,
            isFilterApplied: true,
            isLoading: false,
          };
        });
      },
      error: (error: unknown) => {
        this.handleError(error);
        return EMPTY;
      },
    });
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

  private sortAppsByName(filteredApps: AvailableApp[]): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const firstLetters = [
      ...new Set<string>(filteredApps.map((app) => app.name.slice(0, 1).toUpperCase())),
    ].sort((a, b) => a.localeCompare(b));

    firstLetters.forEach((firstLetter) => {
      const appsSortedByFirstLetter = filteredApps.filter(
        (app) => app.name.toUpperCase().startsWith(firstLetter),
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
      ).sort(this.sortAppsByNameAndSearchQuery);

      appsByCategory.push({
        title: updateDate.toString(),
        apps: appsSortedByLastUpdateDate,
        totalApps: appsSortedByLastUpdateDate.length,
        category: updateDate.toString(),
      });
    });

    return appsByCategory;
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

    const filterAppsByNameAndTrain = (apps: AvailableApp[]): AvailableApp[] => apps.filter((app) => {
      return filteredApps.some((filteredApp) => filteredApp.train === app.train && filteredApp.name === app.name);
    });

    const filteredRecommendedApps = filterAppsByNameAndTrain(recommendedApps).map(
      (app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] }),
    );
    const filteredLatestApps = filterAppsByNameAndTrain(latestApps).map(
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
      ).sort(this.sortAppsByNameAndSearchQuery);

      appsByCategory.push({
        title: category,
        apps: hasCategoriesFilter ? categorizedApps : categorizedApps.slice(0, this.appsPerCategory),
        totalApps: categorizedApps.length,
        category,
      });
    });

    return appsByCategory;
  }

  private handleError(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.patchState((state: AppsFilterState): AppsFilterState => {
      return {
        ...state,
        isLoading: false,
      };
    });
  }

  private sortAppsByNameAndSearchQuery = (a: AvailableApp, b: AvailableApp): number => {
    const searchQuery = this.state().searchQuery;
    const aStartsWithQuery = a.name.toLocaleLowerCase().startsWith(searchQuery);
    const bStartsWithQuery = b.name.toLocaleLowerCase().startsWith(searchQuery);

    if (aStartsWithQuery && !bStartsWithQuery) {
      return -1;
    }
    if (!aStartsWithQuery && bStartsWithQuery) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  };
}
