import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable, Subscription, catchError, combineLatest, filter, of, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface InstalledAppsState {
  installedApps: App[];
  isLoading: boolean;
}

const initialState: InstalledAppsState = {
  installedApps: [],
  isLoading: false,
};

@UntilDestroy()
@Injectable()
export class InstalledAppsStore extends ComponentStore<InstalledAppsState> implements OnDestroy {
  readonly installedApps$ = this.select((state) => state.installedApps);
  readonly isLoading$ = this.select((state) => state.isLoading);
  private installedAppsSubscription: Subscription;

  constructor(
    private appsService: ApplicationsService,
    private appsStore: AppsStore,
    private appsStats: AppsStatsService,
    private dockerStore: DockerStore,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
    this.initialize();
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.setState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => this.loadInstalledApps()),
      tap(() => {
        this.patchState({
          isLoading: false,
        });
      }),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    );
  });

  private handleError(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.patchState({
      isLoading: false,
    });
  }

  private handleRemovedApps(updatedAppName: string, allApps: AvailableApp[]): AvailableApp[] {
    return allApps.map((app) => {
      if (app.name === updatedAppName) {
        return { ...app, installed: false } as AvailableApp;
      }
      return app;
    });
  }

  private subscribeToInstalledAppsUpdates(): void {
    if (this.installedAppsSubscription) {
      return;
    }

    // TODO: Messy. Refactor.
    this.installedAppsSubscription = this.appsService.getInstalledAppsUpdates().pipe(
      tap(() => this.patchState({ isLoading: true })),
      tap((apiEvent: ApiEvent<App>) => {
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
          this.patchState({ isLoading: false });
        }
        return apiEvent.msg !== IncomingApiMessageType.Removed;
      }),
      tap((apiEvent) => {
        const app = apiEvent.fields;
        if (!app) {
          return;
        }
        this.patchState((state: InstalledAppsState): InstalledAppsState => {
          if (apiEvent.msg === IncomingApiMessageType.Added) {
            return {
              ...state,
              installedApps: [...state.installedApps, app],
            };
          }
          return {
            ...state,
            installedApps: state.installedApps.map((installedApp) => {
              if (installedApp.name === apiEvent.id) {
                return { ...installedApp, ...app };
              }
              return installedApp;
            }),
          };
        });

        const updateApps = (appsToUpdate: AvailableApp[]): AvailableApp[] => appsToUpdate.map((appDate) => {
          return app.name === app.id ? { ...appDate, installed: true } : appDate;
        });

        this.appsStore.patchState((state) => {
          return {
            ...state,
            availableApps: updateApps(state.availableApps),
            recommendedApps: updateApps(state.recommendedApps),
            latestApps: updateApps(state.latestApps),
          };
        });
      }),
      tap(() => this.patchState({ isLoading: false })),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadInstalledApps(): Observable<unknown> {
    return combineLatest([
      this.dockerStore.isLoading$,
      this.dockerStore.isDockerStarted$,
    ]).pipe(
      filter(([loading, isDockerStarted]) => {
        return !loading && isDockerStarted !== null;
      }),
      tap(([, isDockerStarted]) => {
        if (isDockerStarted) {
          this.appsStats.subscribeToUpdates();
          this.subscribeToInstalledAppsUpdates();
        }
      }),
      switchMap(([, isDockerStarted]) => {
        if (!isDockerStarted) {
          return of([]);
        }

        return this.appsService.getAllApps().pipe(
          tap((installedApps) => {
            this.patchState({
              installedApps: [...installedApps],
            });
          }),
        );
      }),
      untilDestroyed(this),
    );
  }
}
