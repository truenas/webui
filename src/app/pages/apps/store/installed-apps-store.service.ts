import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY, Observable, Subscription, catchError,
  combineLatest, filter, of, switchMap, tap,
} from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
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
    this.getStats();
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
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    );
  });

  readonly getStats = this.effect(() => {
    return this.installedApps$.pipe(
      filter((apps) => apps.length > 0),
      tapOnce(() => this.appsStats.subscribeToUpdates()),
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

  private loadInstalledApps(): Observable<App[]> {
    return combineLatest([
      this.dockerStore.isLoading$,
      this.dockerStore.isDockerStarted$,
    ]).pipe(
      filter(([isLoading, isDockerStarted]) => !isLoading && isDockerStarted !== null),
      tap(() => this.patchState({ isLoading: true })),
      switchMap(([, isDockerStarted]) => {
        if (!isDockerStarted) {
          return of([]);
        }

        return this.appsService.getAllApps().pipe(
          tap((installedApps) => this.patchState({ installedApps })),
          tap(() => this.subscribeToInstalledAppsUpdates()),
        );
      }),
      tap(() => this.patchState({ isLoading: false })),
      untilDestroyed(this),
    );
  }

  private subscribeToInstalledAppsUpdates(): void {
    if (this.installedAppsSubscription) {
      return;
    }

    this.installedAppsSubscription = this.appsService.getInstalledAppsUpdates().pipe(
      tap((apiEvent: ApiEvent<App>) => {
        this.handleApiEvent(apiEvent);
        this.patchState({ isLoading: false });
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private handleApiEvent(apiEvent: ApiEvent<App>): void {
    switch (apiEvent.msg) {
      case CollectionChangeType.Removed:
        this.handleRemovedEvent(apiEvent);
        break;
      case CollectionChangeType.Added:
      case CollectionChangeType.Changed:
        this.handleAddedOrUpdatedEvent(apiEvent);
        break;
      default:
        console.error('Unknown API event type');
        break;
    }
  }

  private handleRemovedEvent(apiEvent: ApiEvent<App>): void {
    const appId = apiEvent.id.toString();

    this.patchState((state: InstalledAppsState): InstalledAppsState => ({
      ...state,
      installedApps: state.installedApps.filter((app) => app.name !== appId),
    }));

    const updateApps = (updatedAppName: string, allApps: AvailableApp[]): AvailableApp[] => {
      return allApps.map((app) => {
        if (app.name === updatedAppName) {
          return { ...app, installed: false };
        }
        return app;
      });
    };

    this.appsStore.patchState((state) => ({
      ...state,
      availableApps: updateApps(appId, state.availableApps),
      recommendedApps: updateApps(appId, state.recommendedApps),
      latestApps: updateApps(appId, state.latestApps),
    }));
  }

  private handleAddedOrUpdatedEvent(apiEvent: ApiEvent<App>): void {
    const app = apiEvent.fields;
    if (!app) {
      console.error('No app data in API event');
      return;
    }

    this.patchState((state: InstalledAppsState): InstalledAppsState => {
      if (apiEvent.msg === CollectionChangeType.Added) {
        return { ...state, installedApps: [...state.installedApps, app] };
      }

      return {
        ...state,
        installedApps: state.installedApps.map(
          (installedApp) => (installedApp.name === apiEvent.id ? { ...installedApp, ...app } : installedApp),
        ),
      };
    });

    const updateApps = (apps: AvailableApp[]): AvailableApp[] => apps.map(
      (availableApp) => (availableApp.name === app.id ? { ...availableApp, installed: true } : availableApp),
    );

    this.appsStore.patchState((state) => ({
      ...state,
      availableApps: updateApps(state.availableApps),
      recommendedApps: updateApps(state.recommendedApps),
      latestApps: updateApps(state.latestApps),
    }));
  }
}
