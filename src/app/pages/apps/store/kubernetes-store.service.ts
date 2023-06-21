import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  Observable, catchError, of, switchMap, tap,
} from 'rxjs';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

export interface KubernetesState {
  kubernetesConfig: KubernetesConfig;
  isKubernetesStarted: boolean;
  isLoading: boolean;
  selectedPool: string;
}

const initialState: KubernetesState = {
  kubernetesConfig: null,
  isKubernetesStarted: false,
  isLoading: false,
  selectedPool: null,
};

@Injectable()
export class KubernetesStore extends ComponentStore<KubernetesState> {
  readonly isKubernetesStarted$ = this.select((state) => state.isKubernetesStarted);

  readonly selectedPool$ = this.select((state) => state.selectedPool);

  readonly isLoading$ = this.select((state) => state.isLoading);

  constructor(
    private appsService: ApplicationsService,
  ) {
    super(initialState);
    this.initialize();
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            isLoading: true,
          };
        });
      }),
      switchMap(() => this.appsService.getKubernetesConfig()),
      tap((config: KubernetesConfig) => {
        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            kubernetesConfig: { ...config },
            selectedPool: config.pool,
          };
        });
      }),
      switchMap((config) => {
        if (config.pool) {
          return this.appsService.getKubernetesServiceStarted();
        }
        return of(false);
      }),
      tap((isKubernetesStarted) => {
        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            isKubernetesStarted,
            isLoading: false,
          };
        });
      }),
      catchError(() => of(this.handleError())),
    );
  });

  private handleError(): void {
    this.patchState((state: KubernetesState): KubernetesState => {
      return {
        ...state,
        isLoading: false,
      };
    });
  }

  updateSelectedPool = this.updater((state: KubernetesState, pool: string) => {
    return {
      ...state,
      selectedPool: pool,
    };
  });
}
