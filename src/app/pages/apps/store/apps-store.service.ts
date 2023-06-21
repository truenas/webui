import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, Subscription, catchError, combineLatest, map, of, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
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

  isLoading: boolean;

  selectedPool: string;
  installedApps: ChartRelease[];
  isKubernetesStarted: boolean;
}

const initialState: AppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  isLoading: false,
  installedApps: [],
  selectedPool: null,
  isKubernetesStarted: false,
};

@UntilDestroy()
@Injectable()
export class AppsStore extends ComponentStore<AppsState> {
  readonly isLoading$ = this.select((state) => state.isLoading);

  readonly recommendedApps$ = this.select((state) => state.recommendedApps);
  readonly latestApps$ = this.select((state) => state.latestApps);
  readonly appsCategories$ = this.select((state) => [
    ...state.categories,
    AppExtraCategory.NewAndUpdated,
    AppExtraCategory.Recommended,
  ]);
  readonly availableApps$ = this.select((state) => state.availableApps);
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly selectedPool$ = this.select((state) => state.selectedPool);

  readonly isKubernetesStarted$ = this.select((state) => state.isKubernetesStarted);

  private installedAppsSubscription: Subscription;

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private appsService: ApplicationsService,
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
            isLoading: false,
          };
        });
      }),
      catchError(() => of(this.handleError())),
    );
  });

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
}
