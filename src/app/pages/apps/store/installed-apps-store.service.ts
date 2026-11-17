import {
  computed, DestroyRef, inject, Injectable,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY, Observable, Subscription, filter, pipe, switchMap, tap,
} from 'rxjs';
import { App } from 'app/interfaces/app.interface';
import { AppQueryEvent, ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

enum SortableField {
  Application = 'application',
  State = 'state',
  Updates = 'updates',
}

export type AppsSortDirection = 'asc' | 'desc' | '';

export interface AppsSort {
  active: string;
  direction: AppsSortDirection;
}

export interface InstalledAppsState {
  installedApps: App[];
  isLoading: boolean;
  searchQuery: string;
  sortingInfo: AppsSort;
}

const initialState: InstalledAppsState = {
  installedApps: [],
  isLoading: false,
  searchQuery: '',
  sortingInfo: {
    active: SortableField.Application,
    direction: 'asc',
  },
};

@Injectable()
export class InstalledAppsStore {
  private appsService = inject(ApplicationsService);
  private appsStore = inject(AppsStore);
  private appsStats = inject(AppsStatsService);
  private dockerStore = inject(DockerStore);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  private readonly state = signalState(initialState);

  readonly installedApps = this.state.installedApps;
  readonly isLoading = this.state.isLoading;
  readonly searchQuery = this.state.searchQuery;
  readonly sortingInfo = this.state.sortingInfo;

  /**
   * Whether Docker is running, once `DockerStore` has loaded and knows. Apps are (re)loaded every time
   * this changes, so that starting Docker brings the list in without a page reload.
   */
  private readonly isDockerStarted$ = toObservable(computed(() => {
    return this.dockerStore.isLoading() ? null : this.dockerStore.isDockerStarted();
  })).pipe(filter((isDockerStarted) => isDockerStarted !== null));

  private installedAppsSubscription: Subscription | undefined;
  private isSubscribedToStats = false;

  readonly initialize = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { ...initialState, isLoading: true })),
    switchMap(() => this.isDockerStarted$),
    switchMap((isDockerStarted) => this.loadInstalledApps(isDockerStarted)),
  ));

  constructor() {
    this.initialize();
  }

  setSearchQuery(searchQuery: string): void {
    patchState(this.state, { searchQuery });
  }

  setSortingInfo(sortingInfo: AppsSort): void {
    patchState(this.state, { sortingInfo });
  }

  private loadInstalledApps(isDockerStarted: boolean): Observable<unknown> {
    if (!isDockerStarted) {
      patchState(this.state, { isLoading: false });
      return EMPTY;
    }

    // Raised here rather than before `switchMap`, which finalizes the request it replaces first.
    patchState(this.state, { isLoading: true });
    return this.appsService.getAllApps().pipe(
      tapResponse({
        next: (installedApps: App[]) => {
          this.setInstalledApps(installedApps);
          this.subscribeToInstalledAppsUpdates();
        },
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
        finalize: () => patchState(this.state, { isLoading: false }),
      }),
    );
  }

  /**
   * Stats are only worth subscribing to once there is an installed app to show them for.
   */
  private setInstalledApps(installedApps: App[]): void {
    patchState(this.state, { installedApps });

    if (installedApps.length && !this.isSubscribedToStats) {
      this.isSubscribedToStats = true;
      this.appsStats.subscribeToUpdates();
    }
  }

  private subscribeToInstalledAppsUpdates(): void {
    if (this.installedAppsSubscription) {
      return;
    }

    this.installedAppsSubscription = this.appsService.getInstalledAppsUpdates().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((apiEvent) => {
      this.handleApiEvent(apiEvent);
      patchState(this.state, { isLoading: false });
    });
  }

  private handleApiEvent(apiEvent: AppQueryEvent): void {
    if (apiEvent.msg === 'removed') {
      this.handleRemovedEvent(apiEvent);
    } else {
      this.handleAddedOrUpdatedEvent(apiEvent);
    }
  }

  private handleRemovedEvent(apiEvent: Extract<AppQueryEvent, { msg: 'removed' }>): void {
    const appId = apiEvent.id;

    this.setInstalledApps(this.state.installedApps().filter((app) => app.name !== appId));
    this.appsStore.setAppInstalled(appId, false);
  }

  private handleAddedOrUpdatedEvent(apiEvent: Exclude<AppQueryEvent, { msg: 'removed' }>): void {
    const app = apiEvent.fields;
    if (!app) {
      console.error('No app data in API event');
      return;
    }

    const installedApps = this.state.installedApps();
    if (apiEvent.msg === 'added') {
      this.setInstalledApps([...installedApps, app]);
    } else {
      this.setInstalledApps(installedApps.map(
        (installedApp) => (installedApp.name === apiEvent.id ? { ...installedApp, ...app } : installedApp),
      ));
    }

    this.appsStore.setAppInstalled(app.id, true);
  }
}
