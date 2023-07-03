import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, Subscription, catchError, filter, of, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

export interface InstalledAppsState {
  installedApps: ChartRelease[];
  isLoading: boolean;
}

const initialState: InstalledAppsState = {
  installedApps: [],
  isLoading: false,
};

@UntilDestroy()
@Injectable()
export class InstalledAppsStore extends ComponentStore<InstalledAppsState> {
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly isLoading$ = this.select((state) => state.isLoading);
  private installedAppsSubscription: Subscription;

  constructor(
    private appsService: ApplicationsService,
    private appsStore: AppsStore,
    private kubernetesStore: KubernetesStore,
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
      switchMap(() => this.loadInstalledApps()),
      tap(() => {
        this.patchState((state: InstalledAppsState): InstalledAppsState => {
          return {
            ...state,
            isLoading: false,
          };
        });
      }),
      catchError(() => of(this.handleError())),
    );
  });

  private handleError(): void {
    this.patchState((state: InstalledAppsState): InstalledAppsState => {
      return {
        ...state,
        isLoading: false,
      };
    });
  }

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
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
              return {
                ...state,
                installedApps: state.installedApps.filter((app) => app.name !== apiEvent.id.toString()),
              };
            });
            this.appsStore.patchState((state) => {
              return {
                ...state,
                availableApps: handleRemovedApps(state.availableApps),
                recommendedApps: handleRemovedApps(state.recommendedApps),
                latestApps: handleRemovedApps(state.latestApps),
              };
            });
            break;
          case IncomingApiMessageType.Added:
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
              return {
                ...state,
                installedApps: [...state.installedApps, apiEvent.fields],
              };
            });
            this.appsStore.patchState((state) => {
              return {
                ...state,
                availableApps: handleChangedApps(state.availableApps),
                recommendedApps: handleChangedApps(state.recommendedApps),
                latestApps: handleChangedApps(state.latestApps),
              };
            });
            break;
          case IncomingApiMessageType.Changed:
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
              return {
                ...state,
                installedApps: handleChangedApps(state.installedApps) as unknown as ChartRelease[],
              };
            });
            this.appsStore.patchState((state) => {
              return {
                ...state,
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

  private loadInstalledApps(): Observable<unknown> {
    return this.kubernetesStore.isLoading$.pipe(
      filter((loading) => !loading),
      switchMap(() => this.kubernetesStore.isKubernetesStarted$),
      switchMap((isKubernetesStarted) => {
        return isKubernetesStarted ? this.appsService.getAllChartReleases().pipe(
          tap((installedApps: ChartRelease[]) => {
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
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
