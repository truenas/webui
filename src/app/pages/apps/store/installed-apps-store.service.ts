import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, Subscription, catchError, combineLatest, filter, of, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
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
      catchError(() => {
        this.handleError();
        return of(undefined);
      }),
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

  private handleRemovedApps(updatedAppName: string, allApps: AvailableApp[]): AvailableApp[] {
    return allApps.map((app) => {
      if (app.name === updatedAppName) {
        return { ...app as object, installed: false } as AvailableApp;
      }
      return app;
    });
  }

  private subscribeToInstalledAppsUpdates(): void {
    if (this.installedAppsSubscription) {
      return;
    }

    this.installedAppsSubscription = this.appsService.getInstalledAppsUpdates().pipe(
      tap(() => this.patchState((state) => ({ ...state, isLoading: true }))),
      tap((apiEvent: ApiEvent) => {
        if (apiEvent.msg === IncomingApiMessageType.Removed) {
          this.patchState((state: InstalledAppsState): InstalledAppsState => {
            return {
              ...state,
              installedApps: state.installedApps.filter((app) => app.name !== apiEvent.id.toString()),
            };
          });
          this.appsStore.patchState((state) => {
            return {
              ...state,
              availableApps: this.handleRemovedApps(apiEvent.id as string, state.availableApps),
              recommendedApps: this.handleRemovedApps(apiEvent.id as string, state.recommendedApps),
              latestApps: this.handleRemovedApps(apiEvent.id as string, state.latestApps),
            };
          });
        }
      }),
      filter((apiEvent) => {
        if (apiEvent.msg === IncomingApiMessageType.Removed) {
          this.patchState((state) => ({ ...state, isLoading: false }));
        }
        return apiEvent.msg !== IncomingApiMessageType.Removed;
      }),
      switchMap((apiEvent: ApiEvent) => combineLatest([
        of(apiEvent),
        this.appsService.getChartRelease(apiEvent.id as string),
      ])),
      tap(([apiEvent, chartReleases]) => {
        if (!chartReleases?.length) {
          return;
        }
        this.patchState((state: InstalledAppsState): InstalledAppsState => {
          if (apiEvent.msg === IncomingApiMessageType.Added) {
            return {
              ...state,
              installedApps: [...state.installedApps, { ...chartReleases[0] }],
            };
          }
          return {
            ...state,
            installedApps: state.installedApps.map((installedApp) => {
              if (installedApp.name === apiEvent.id) {
                return { ...installedApp, ...chartReleases[0] };
              }
              return installedApp;
            }),
          };
        });
        this.appsStore.patchState((state) => {
          return {
            ...state,
            availableApps: state.availableApps.map((app) => {
              if (app.name === chartReleases[0].id) {
                return { ...app, installed: true };
              }
              return app;
            }),
            recommendedApps: state.recommendedApps.map((app) => {
              if (app.name === chartReleases[0].id) {
                return { ...app, installed: true };
              }
              return app;
            }),
            latestApps: state.latestApps.map((app) => {
              if (app.name === chartReleases[0].id) {
                return { ...app, installed: true };
              }
              return app;
            }),
          };
        });
      }),
      tap(() => this.patchState((state) => ({ ...state, isLoading: false }))),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadInstalledApps(): Observable<unknown> {
    return this.kubernetesStore.isLoading$.pipe(
      filter((loading) => !loading),
      switchMap(() => this.kubernetesStore.isKubernetesStarted$),
      filter((isKubernetesStarted) => isKubernetesStarted !== null),
      switchMap((isKubernetesStarted) => {
        return isKubernetesStarted ? this.appsService.getAllChartReleases().pipe(
          tap((installedApps: ChartRelease[]) => {
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
              return {
                ...state,
                installedApps: [...installedApps],
              };
            });
            if (isKubernetesStarted) {
              this.subscribeToInstalledAppsUpdates();
            }
          }),
        ) : of([]);
      }),
    );
  }
}
