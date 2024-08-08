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
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.service';
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
    private dockerStore: DockerStore,
    private errorHandler: ErrorHandlerService,
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
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
    );
  });

  private handleError(error: unknown): void {
    this.errorHandler.showErrorModal(error);
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
        this.appsService.getApp(apiEvent.id as string),
      ])),
      tap(([apiEvent, apps]) => {
        if (!apps?.length) {
          return;
        }
        this.patchState((state: InstalledAppsState): InstalledAppsState => {
          if (apiEvent.msg === IncomingApiMessageType.Added) {
            return {
              ...state,
              installedApps: [...state.installedApps, { ...apps[0] }],
            };
          }
          return {
            ...state,
            installedApps: state.installedApps.map((installedApp) => {
              if (installedApp.name === apiEvent.id) {
                return { ...installedApp, ...apps[0] };
              }
              return installedApp;
            }),
          };
        });

        const updateApps = (appsToUpdate: AvailableApp[]): AvailableApp[] => appsToUpdate.map((app) => {
          return app.name === apps[0].id ? { ...app, installed: true } : app;
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
      tap(() => this.patchState((state) => ({ ...state, isLoading: false }))),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadInstalledApps(): Observable<unknown> {
    return this.dockerStore.isLoading$.pipe(
      filter(
        (loading) => !loading,
      ),
      switchMap(() => this.dockerStore.isDockerStarted$),
      filter((isDockerStarted) => isDockerStarted !== null),
      tap((isDockerStarted) => {
        if (isDockerStarted) {
          this.subscribeToInstalledAppsUpdates();
        }
      }),
      switchMap((isDockerStarted) => {
        if (!isDockerStarted) {
          return of([]);
        }

        return this.appsService.getAllApps().pipe(
          tap((installedApps: App[]) => {
            this.patchState((state: InstalledAppsState): InstalledAppsState => {
              return {
                ...state,
                installedApps: [...installedApps],
              };
            });
          }),
        );
      }),
    );
  }
}
