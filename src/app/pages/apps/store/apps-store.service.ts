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
import { AvailableApp } from 'app/interfaces/available-app.interface';
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

export interface AppsState {
  availableApps: AvailableApp[];
  latestApps: AvailableApp[];
  recommendedApps: AvailableApp[];
  categories: string[];
  catalogs: string[];
  filteredApps: AvailableApp[];
  filter: AppsFiltersValues;
  isLoading: boolean;
  isFilterApplied: boolean;
  searchQuery: string;
  selectedPool: string;
  installedApps: ChartRelease[];
  isKubernetesStarted: boolean;
}

const initialState: AppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  catalogs: [],
  filteredApps: [],
  isLoading: false,
  isFilterApplied: false,
  filter: {
    categories: [],
    sort: null,
    catalogs: [],
  },
  searchQuery: '',
  installedApps: [],
  selectedPool: null,
  isKubernetesStarted: false,
};

@UntilDestroy()
@Injectable()
export class AppsStore extends ComponentStore<AppsState> {
  readonly appsPerCategory = 6;

  readonly searchedApps$ = this.select((state): AppsByCategory[] => {
    const allApps: AvailableApp[] = state.filteredApps?.length ? [...state.filteredApps] : [...state.availableApps];
    const filteredApps: AvailableApp[] = allApps
      .filter((app) => this.doesAppContainString(state.searchQuery, app));

    if (state.filter.sort === AppsFiltersSort.Name) {
      return this.sortAppsByName(filteredApps);
    }
    if (state.filter.sort === AppsFiltersSort.Catalog) {
      return this.sortAppsByCatalog(filteredApps);
    }
    if (state.filter.sort === AppsFiltersSort.LastUpdate) {
      return this.sortAppsByLastUpdate(filteredApps);
    }
    return this.sortAppsByCategory(filteredApps, state);
  });

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isFilterApplied$ = this.select((state) => state.isFilterApplied);
  readonly searchQuery$ = this.select((state) => state.searchQuery);
  readonly appsCategories$ = this.select((state) => [
    ...state.categories,
    AppExtraCategory.NewAndUpdated,
    AppExtraCategory.Recommended,
  ]);
  readonly availableApps$ = this.select((state) => state.availableApps);
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly selectedPool$ = this.select((state) => state.selectedPool);
  readonly filterValues$ = this.select((state) => state.filter);
  readonly isKubernetesStarted$ = this.select((state) => state.isKubernetesStarted);
  readonly appsByCategories$ = this.select((state: AppsState): AppsByCategory[] => {
    return this.sortAppsByCategory(state.availableApps, state);
  });
  readonly catalogs$ = this.select((state) => state.catalogs);

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

  private handleError(): void {
    this.patchState((state: AppsState): AppsState => {
      return {
        ...state,
        isLoading: false,
      };
    });
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
        this.patchState((state: AppsState): AppsState => {
          return {
            ...state,
            filteredApps: [],
            isLoading: false,
          };
        });
      }),
      catchError(() => of(this.handleError())),
    );
  });

  resetFilters = this.updater((state: AppsState) => {
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
      request$ = this.appsService.getLatestApps({
        ...filter,
        categories: filter.categories.filter((category) => !category.includes(AppExtraCategory.NewAndUpdated)),
      });
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (filteredApps) => {
        this.patchState((state: AppsState): AppsState => {
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
      error: () => of(this.handleError()),
    });
  }

  applySearchQuery = this.updater((state: AppsState, searchQuery: string) => {
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
        const handleRemovedApps = (apps: unknown[]): AvailableApp[] => apps.map((chartRelease) => {
          if ((chartRelease as { name: string }).name === apiEvent.id.toString()) {
            return { ...chartRelease as object, installed: false } as AvailableApp;
          }
          return chartRelease as AvailableApp;
        });

        const handleChangedApps = (apps: unknown[]): AvailableApp[] => apps.map((chartRelease) => {
          if ((chartRelease as { name: string }).name === apiEvent.id.toString()) {
            return { ...chartRelease as object, ...apiEvent.fields } as unknown as AvailableApp;
          }
          return chartRelease as AvailableApp;
        });

        switch (apiEvent.msg) {
          case IncomingApiMessageType.Removed:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: state.installedApps.filter((app) => app.name !== apiEvent.id.toString()),
                availableApps: handleRemovedApps(state.availableApps),
                recommendedApps: handleRemovedApps(state.recommendedApps),
                latestApps: handleRemovedApps(state.latestApps),
              };
            });
            break;
          case IncomingApiMessageType.Added:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: [...state.installedApps, apiEvent.fields],
                availableApps: handleChangedApps(state.availableApps),
                recommendedApps: handleChangedApps(state.recommendedApps),
                latestApps: handleChangedApps(state.latestApps),
              };
            });
            break;
          case IncomingApiMessageType.Changed:
            this.patchState((state) => {
              return {
                ...state,
                installedApps: handleChangedApps(state.installedApps) as unknown as ChartRelease[],
                availableApps: handleChangedApps(state.availableApps),
                recommendedApps: handleChangedApps(state.recommendedApps),
                latestApps: handleChangedApps(state.latestApps),
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
            catalogs: [...new Set(availableApps?.map((app) => app.catalog))],
            availableApps: [...availableApps],
            recommendedApps: availableApps
              .filter((app) => app.recommended)
              .map((app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] })),
          };
        });
      }),
    );
  }

  updateSelectedPool = this.updater((state: AppsState, pool: string) => {
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

  private sortAppsByCatalog(filteredApps: AvailableApp[]): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const catalogs = [...new Set<string>(filteredApps.map((app) => app.catalog))].sort((a, b) => a.localeCompare(b));

    catalogs.forEach((catalog) => {
      const appsSortedByCatalog = filteredApps.filter((app) => app.catalog === catalog);

      appsByCategory.push({
        title: catalog,
        apps: appsSortedByCatalog,
        totalApps: appsSortedByCatalog.length,
        category: catalog,
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
      );

      appsByCategory.push({
        title: updateDate.toString(),
        apps: appsSortedByLastUpdateDate,
        totalApps: appsSortedByLastUpdateDate.length,
        category: updateDate.toString(),
      });
    });

    return appsByCategory;
  }

  private sortAppsByCategory(filteredApps: AvailableApp[], state: AppsState): AppsByCategory[] {
    const appsByCategory: AppsByCategory[] = [];

    const hasCategoriesFilter = state.filter.categories.length > 0;

    const availableCategories = hasCategoriesFilter
      ? state.categories.filter((category) => state.filter.categories.includes(category))
      : state.categories;

    const filterApps = (apps: AvailableApp[]): AvailableApp[] => apps.filter((app) => {
      return filteredApps.some((filteredApp) => filteredApp.train === app.train && filteredApp.name === app.name);
    });

    const filteredRecommendedApps = filterApps(state.recommendedApps);
    const filteredLatestApps = filterApps(state.latestApps);

    if (state.filter.categories.includes(AppExtraCategory.NewAndUpdated) || !hasCategoriesFilter) {
      appsByCategory.push({
        title: this.translate.instant('New & Updated Apps'),
        apps: hasCategoriesFilter ? filteredLatestApps : filteredLatestApps.slice(0, this.appsPerCategory),
        totalApps: filteredLatestApps.length,
        category: AppExtraCategory.NewAndUpdated,
      });
    }

    if (state.filter.categories.includes(AppExtraCategory.Recommended) || !hasCategoriesFilter) {
      appsByCategory.push({
        title: this.translate.instant('Recommended Apps'),
        apps: hasCategoriesFilter ? filteredRecommendedApps : filteredRecommendedApps.slice(0, this.appsPerCategory),
        totalApps: filteredRecommendedApps.length,
        category: AppExtraCategory.Recommended,
      });
    }

    availableCategories.forEach((category) => {
      const categorizedApps = filteredApps.filter(
        (app) => app.categories.some((appCategory) => appCategory === category),
      );

      appsByCategory.push({
        title: category,
        apps: categorizedApps.slice(0, this.appsPerCategory),
        totalApps: categorizedApps.length,
        category,
      });
    });

    return appsByCategory;
  }
}
