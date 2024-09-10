import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable, catchError, combineLatest, debounceTime, filter, of, switchMap, tap,
} from 'rxjs';
import { App } from 'app/interfaces/app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
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

  constructor(
    private appsService: ApplicationsService,
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

  private loadInstalledApps(): Observable<unknown> {
    return combineLatest([
      this.dockerStore.isLoading$,
      this.dockerStore.isDockerStarted$,
    ]).pipe(
      debounceTime(300),
      filter(([loading, isDockerStarted]) => {
        return !loading && isDockerStarted !== null;
      }),
      switchMap((isDockerStarted) => {
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
