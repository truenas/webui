import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable, catchError, combineLatest, of, switchMap, tap,
} from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface AppsByCategory {
  title: string;
  apps: AvailableApp[];
  totalApps: number;
  category: string;
}

export interface AvailableAppsState {
  availableApps: AvailableApp[];
  latestApps: AvailableApp[];
  recommendedApps: AvailableApp[];
  categories: string[];
  appsByCategories: AppsByCategory[];
  filteredApps: AvailableApp[];
  filter: AppsFiltersValues;
  isLoading: boolean;
  isFilterApplied: boolean;
  appsPerCategory: 6;
  searchQuery: string;
  searchedApps: AvailableApp[];
}

const initialState: AvailableAppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  filteredApps: [],
  appsPerCategory: 6,
  isLoading: false,
  isFilterApplied: false,
  filter: {
    categories: [],
    sort: AppsFiltersSort.Name,
    catalogs: [],
  },
  appsByCategories: [],
  searchQuery: '',
  searchedApps: [],
};

@Injectable()
export class AvailableAppsStore extends ComponentStore<AvailableAppsState> {
  // readonly recommendedAppsSlice$ = this.select((state) => state.recommendedApps.slice(0, state.appsPerCategory));
  // readonly latestAppsSlice$ = this.select((state) => state.latestApps.slice(0, state.appsPerCategory));
  readonly searchedApps$ = this.select((state) => state.searchedApps);
  readonly appsByCategories$ = this.select((state) => state.appsByCategories);
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly appsByCategory$ = this.select((state) => state.appsByCategories);
  readonly isFilterApplied$ = this.select((state) => state.isFilterApplied);
  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly sliceAmount$ = this.select((state) => state.appsPerCategory);
  readonly appsCategories$ = this.select((state) => state.categories);
  readonly availableApps$ = this.select((state) => state.availableApps);

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private appsService: ApplicationsService,
    private translate: TranslateService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return combineLatest([
          this.loadLatestApps(),
          this.loadAvailableApps(),
          this.loadCategories(),
        ]);
      }),
      tap((
        [
          latestApps,
          availableApps,
          categories,
        ]: [AvailableApp[], AvailableApp[], string[]],
      ) => {
        this.patchState((state: AvailableAppsState): AvailableAppsState => {
          const newState: AvailableAppsState = {
            ...state,
            latestApps: [...latestApps],
            availableApps: [...availableApps],
            categories: [...categories],
            filteredApps: [],
            recommendedApps: availableApps.filter((app) => app.recommended),
            isLoading: false,
          };
          newState.appsByCategories = this.getAppsSlicesByCategory(newState);
          return newState;
        });
      }),
    );
  });

  resetFilters = this.updater((state: AvailableAppsState) => {
    return {
      ...state,
      isFilterApplied: false,
      searchQuery: '',
      filteredApps: [],
      searchedApps: [],
    };
  });

  applyFilters(filter: AppsFiltersValues): void {
    if (filter.categories.some((cat) => cat.includes(AppExtraCategory.NewAndUpdated))) {
      filter.categories = filter.categories.filter((cat) => !cat.includes(AppExtraCategory.NewAndUpdated));
      this.patchState((state) => {
        return {
          ...state,
          isLoading: true,
        };
      });
      this.appsService.getLatestApps(filter).pipe(
        tap((filteredApps) => {
          this.patchState((state: AvailableAppsState): AvailableAppsState => {
            return {
              ...state,
              filteredApps: [...filteredApps],
              searchedApps:
                state.searchQuery
                  ? filteredApps.filter((filteredApp) => this.doesAppCotainsString(state.searchQuery, filteredApp))
                  : filteredApps,
              isFilterApplied: true,
              isLoading: false,
            };
          });
        }),
      ).subscribe();
    } else {
      this.patchState((state) => {
        return {
          ...state,
          isLoading: true,
        };
      });
      this.appsService.getAvailableApps(filter).pipe(
        tap((filteredApps) => {
          this.patchState((state: AvailableAppsState): AvailableAppsState => {
            return {
              ...state,
              filteredApps: [...filteredApps],
              searchedApps:
                state.searchQuery
                  ? filteredApps.filter((app) => this.doesAppCotainsString(state.searchQuery, app))
                  : filteredApps,
              isFilterApplied: true,
              isLoading: false,
            };
          });
        }),
      ).subscribe();
    }
  }

  applySearchQuery = this.updater((state: AvailableAppsState, searchQuery: string) => {
    let filteredApps: AvailableApp[] = [];
    if (state.isFilterApplied) {
      filteredApps = [...state.filteredApps];
    }
    if (!filteredApps.length) {
      filteredApps = [...state.availableApps];
    }

    return {
      ...state,
      searchedApps: filteredApps.filter((app) => {
        return this.doesAppCotainsString(searchQuery, app);
      }),
      searchQuery,
    };
  });

  private doesAppCotainsString = (searchQuery: string, app: AvailableApp): boolean => {
    const normalize = (str: string): string => _.toLower(_.deburr(str));
    const isStringsArray = (arr: unknown[]): boolean => arr.every((i) => typeof i === 'string');
    const search = normalize(searchQuery);
    return _.some(app, (value) => {
      if (typeof value === 'string') {
        return normalize(value).includes(search);
      }
      if (Array.isArray(value) && isStringsArray(value)) {
        return value.some((indexVal) => normalize(indexVal).includes(search));
      }
      return false;
    });
  };

  private getAppsSlicesByCategory(state: AvailableAppsState): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    appsByCategory.push({
      title: this.translate.instant('Recommended Apps'),
      apps: state.recommendedApps.slice(0, state.appsPerCategory),
      totalApps: state.recommendedApps.length,
      category: AppExtraCategory.Recommended,
    },
    {
      title: this.translate.instant('New & Updated Apps'),
      apps: state.latestApps.slice(0, state.appsPerCategory),
      totalApps: state.latestApps.length,
      category: AppExtraCategory.NewAndUpdated,
    });

    state.categories.forEach((category) => {
      const categorizedApps = state.availableApps.filter(
        (app) => app.categories.some((appCategory) => appCategory === category),
      );

      appsByCategory.push(
        {
          title: category,
          apps: categorizedApps.slice(0, state.appsPerCategory),
          totalApps: categorizedApps.length,
          category,
        },
      );
    });

    return appsByCategory;
  }

  private loadLatestApps(): Observable<AvailableApp[]> {
    return this.appsService.getLatestApps().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    );
  }

  private loadAvailableApps(): Observable<AvailableApp[]> {
    return this.appsService.getAvailableApps().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    );
  }

  private loadCategories(): Observable<string[]> {
    return this.appsService.getAllAppsCategories().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    );
  }
}
