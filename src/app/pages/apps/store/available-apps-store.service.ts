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
  filteredApps: AvailableApp[];
  filter: AppsFiltersValues;
  isLoading: boolean;
  isFilterApplied: boolean;
  searchQuery: string;
  selectedPool: string;
  installedApps: ChartRelease[];
  isKubernetesStarted: boolean;
}

const initialState: AvailableAppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  filteredApps: [],
  isLoading: false,
  isFilterApplied: false,
  filter: {
    categories: [],
    sort: AppsFiltersSort.Name,
    catalogs: [],
  },
  searchQuery: '',
  installedApps: [],
  selectedPool: null,
  isKubernetesStarted: false,
};

@UntilDestroy()
@Injectable()
export class AvailableAppsStore extends ComponentStore<AvailableAppsState> {
  readonly appsPerCategory = 6;

  readonly searchedApps$ = this.select((state) => {
    if (!state.searchQuery) {
      return [...state.filteredApps];
    }
    let filteredApps: AvailableApp[] = [];
    if (state.isFilterApplied) {
      filteredApps = [...state.filteredApps];
    }
    if (!filteredApps.length) {
      filteredApps = [...state.availableApps];
    }

    return filteredApps.filter((app) => {
      return this.doesAppContainString(state.searchQuery, app);
    });
  });

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isFilterApplied$ = this.select((state) => state.isFilterApplied);
  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly appsCategories$ = this.select((state) => state.categories);
  readonly availableApps$ = this.select((state) => state.availableApps);
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly selectedPool$ = this.select((state) => state.selectedPool);
  readonly filterValues$ = this.select((state) => state.filter);
  readonly isKubernetesStarted$ = this.select((state) => state.isKubernetesStarted);
  readonly appsByCategories$ = this.select((state: AvailableAppsState): AppsByCategory[] => {
    const appsByCategory: AppsByCategory[] = [];

    appsByCategory.push({
      title: this.translate.instant('Recommended Apps'),
      apps: state.recommendedApps.slice(0, this.appsPerCategory),
      totalApps: state.recommendedApps.length,
      category: AppExtraCategory.Recommended,
    },
    {
      title: this.translate.instant('New & Updated Apps'),
      apps: state.latestApps.slice(0, this.appsPerCategory),
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
          apps: categorizedApps.slice(0, this.appsPerCategory),
          totalApps: categorizedApps.length,
          category,
        },
      );
    });

    return appsByCategory;
  });

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
          this.loadLatestApps(),
          this.loadAvailableApps(),
          this.loadCategories(),
          this.loadInstalledApps(),
        ]);
      }),
      tap(() => {
        this.patchState((state: AvailableAppsState): AvailableAppsState => {
          return {
            ...state,
            filteredApps: [],
            isLoading: false,
          };
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
    };
  });

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
            filter: { ...filter },
            filteredApps: [...filteredApps],
            isFilterApplied: true,
            isLoading: false,
          };
        });
      },
    });
  }

  applySearchQuery = this.updater((state: AvailableAppsState, searchQuery: string) => {
    return {
      ...state,
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
        return value.some((indexVal) => (typeof indexVal === 'string' ? normalize(indexVal).includes(search) : false));
      }
      return false;
    });
  };

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

  private loadLatestApps(): Observable<unknown> {
    return this.appsService.getLatestApps().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    ).pipe(
      tap((latestApps: AvailableApp[]) => {
        this.patchState((state) => {
          return {
            ...state,
            latestApps,
          };
        });
      }),
    );
  }

  private loadAvailableApps(): Observable<unknown> {
    return this.appsService.getAvailableApps().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    ).pipe(
      tap((availableApps: AvailableApp[]) => {
        this.patchState((state) => {
          return {
            ...state,
            availableApps: [...availableApps],
            recommendedApps: availableApps
              .filter((app) => app.recommended)
              .map((app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] })),
          };
        });
      }),
    );
  }

  updateSelectedPool = this.updater((state: AvailableAppsState, pool: string) => {
    return {
      ...state,
      selectedPool: pool,
    };
  });

  private loadCategories(): Observable<unknown> {
    return this.appsService.getAllAppsCategories().pipe(
      catchError((error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        return of([]);
      }),
    ).pipe(
      tap((categories: string[]) => {
        categories.unshift(AppExtraCategory.NewAndUpdated, AppExtraCategory.Recommended);
        this.patchState((state) => {
          return {
            ...state,
            categories: [...categories],
          };
        });
      }),
    );
  }

  private loadInstalledApps(): Observable<unknown> {
    return this.appsService.getKubernetesConfig().pipe(
      map((config) => config.pool),
      tap((pool) => {
        this.patchState((state) => {
          return {
            ...state,
            selectedPool: pool,
          };
        });
      }),
      switchMap((pool) => (pool ? this.appsService.getKubernetesServiceStarted() : of(false))),
      tap((isKubernetesStarted) => {
        this.patchState((state) => {
          return {
            ...state,
            isKubernetesStarted,
            isLoading: !!isKubernetesStarted,
          };
        });
      }),
      switchMap((isKubernetesStarted) => {
        return isKubernetesStarted ? this.appsService.getAllChartReleases().pipe(
          tap((installedApps: ChartRelease[]) => {
            this.patchState((state) => {
              return {
                ...state,
                installedApps: [...installedApps],
                isLoading: false,
              };
            });
            if (isKubernetesStarted) {
              this.subscribeToInstalledAppsUpdates();
            }
          }),
        ) : of();
      }),
    );
  }
}
