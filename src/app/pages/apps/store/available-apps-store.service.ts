import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable, Subscription, catchError, combineLatest, map, of, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export const availableAppsShownPerCategory = 6;

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
  appsPerCategory: typeof availableAppsShownPerCategory;
  searchQuery: string;
  searchedApps: AvailableApp[];
  selectedPool: string;
  installedApps: ChartRelease[];
}

const initialState: AvailableAppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  filteredApps: [],
  appsPerCategory: availableAppsShownPerCategory,
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
  installedApps: [],
  selectedPool: null,
};

@UntilDestroy()
@Injectable()
export class AvailableAppsStore extends ComponentStore<AvailableAppsState> {
  readonly searchedApps$ = this.select((state) => state.searchedApps);
  readonly appsByCategories$ = this.select((state) => state.appsByCategories);
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isFilterApplied$ = this.select((state) => state.isFilterApplied);
  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly sliceAmount$ = this.select((state) => state.appsPerCategory);
  readonly appsCategories$ = this.select((state) => state.categories);
  readonly availableApps$ = this.select((state) => state.availableApps);
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly selectedPool$ = this.select((state) => state.selectedPool);
  readonly filterValues$ = this.select((state) => state.filter);

  private installedAppsSubscription: Subscription;

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private appsService: ApplicationsService,
    private translate: TranslateService,
  ) {
    super(initialState);
    this.initialize();
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
          this.loadInstalledApps(),
          this.loadLatestApps(),
          this.loadAvailableApps(),
          this.loadCategories(),
          this.loadAppsPool(),
        ]);
      }),
      tap((
        [
          installedApps,
          latestApps,
          availableApps,
          categories,
          pool,
        ]: [ChartRelease[], AvailableApp[], AvailableApp[], string[], string],
      ) => {
        this.subscribeToInstalledAppsUpdates();
        this.patchState((state: AvailableAppsState): AvailableAppsState => {
          categories.unshift(AppExtraCategory.NewAndUpdated, AppExtraCategory.Recommended);
          const newState: AvailableAppsState = {
            ...state,
            installedApps,
            latestApps: [...latestApps],
            availableApps: [...availableApps],
            categories: [...categories],
            filteredApps: [],
            recommendedApps: availableApps.filter((app) => app.recommended),
            isLoading: false,
            selectedPool: pool,
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
    this.patchState((state) => {
      return {
        ...state,
        isLoading: true,
      };
    });

    let request$: Observable<AvailableApp[]> = this.appsService.getAvailableApps(filter);

    if (filter.categories.some((category) => category.includes(AppExtraCategory.NewAndUpdated))) {
      request$ = this.appsService.getLatestApps(
        {
          ...filter,
          categories: filter.categories.filter((category) => !category.includes(AppExtraCategory.NewAndUpdated)),
        },
      );
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (filteredApps) => {
        this.patchState((state: AvailableAppsState): AvailableAppsState => {
          return {
            ...state,
            filter: { ...filter },
            filteredApps: [...filteredApps],
            searchedApps:
              state.searchQuery
                ? filteredApps.filter((filteredApp) => this.doesAppContainString(state.searchQuery, filteredApp))
                : filteredApps,
            isFilterApplied: true,
            isLoading: false,
          };
        });
      },
    });
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
        return this.doesAppContainString(searchQuery, app);
      }),
      searchQuery,
    };
  });

  private doesAppContainString = (searchQuery: string, app: AvailableApp): boolean => {
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

  private loadInstalledApps(): Observable<ChartRelease[]> {
    return this.appsService.getAllChartReleases().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    );
  }

  private subscribeToInstalledAppsUpdates(): void {
    if (this.installedAppsSubscription) {
      return;
    }
    this.installedAppsSubscription = this.appsService.subscribeToAllChartReleases().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (apiEvent) => {
        switch (apiEvent.msg) {
          case IncomingApiMessageType.Removed:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: state.installedApps.filter(
                  (chartRelease) => chartRelease.name !== apiEvent.id.toString(),
                ),
              };
            });
            break;
          case IncomingApiMessageType.Added:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: [...state.installedApps, apiEvent.fields],
              };
            });
            break;
          case IncomingApiMessageType.Changed:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: state.installedApps.map(
                  (chartRelease) => {
                    if (chartRelease.name === apiEvent.id.toString()) {
                      return {
                        ...apiEvent.fields,
                      };
                    }
                    return chartRelease;
                  },
                ),
              };
            });
            break;
        }
      },
    });
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

  updateSelectedPool = this.updater((state: AvailableAppsState, pool: string) => {
    return {
      ...state,
      selectedPool: pool,
    };
  });

  private loadCategories(): Observable<string[]> {
    return this.appsService.getAllAppsCategories().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    );
  }

  private loadAppsPool(): Observable<string> {
    return this.appsService.getKubernetesConfig().pipe(map((config) => config.pool));
  }
}
