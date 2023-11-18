import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable, ObservableInput, Subscription, catchError, combineLatest, map, of, switchMap, tap,
} from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { KubernetesStatusData } from 'app/interfaces/kubernetes-status-data.interface';
import { KubernetesStatus } from 'app/pages/apps/enum/kubernetes-status.enum';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AuthService } from 'app/services/auth/auth.service';

export interface KubernetesState {
  kubernetesConfig: KubernetesConfig;
  isKubernetesStarted: boolean;
  kubernetesStatus: KubernetesStatus | null;
  kubernetesStatusDescription: string | null;
  isLoading: boolean;
  selectedPool: string;
}

const initialState: KubernetesState = {
  kubernetesConfig: null,
  isKubernetesStarted: null,
  isLoading: false,
  selectedPool: null,
  kubernetesStatus: null,
  kubernetesStatusDescription: null,
};

@UntilDestroy()
@Injectable()
export class KubernetesStore extends ComponentStore<KubernetesState> {
  private kubernetesStatusSubscription: Subscription;

  readonly isKubernetesStarted$ = this.select((state) => state.isKubernetesStarted);
  readonly selectedPool$ = this.select((state) => state.selectedPool);
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly kubernetesStatus$ = this.select((state) => state.kubernetesStatus);
  readonly kubernetesStatusDescription$ = this.select((state) => state.kubernetesStatusDescription);

  constructor(private appsService: ApplicationsService, private authService: AuthService) {
    super(initialState);
    this.authService.isAuthenticated$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (authenticated) => {
        if (authenticated) {
          this.initialize();
        } else {
          if (this.kubernetesStatusSubscription) {
            this.kubernetesStatusSubscription.unsubscribe();
            this.kubernetesStatusSubscription = null;
          }
        }
      },
    });
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.setState((): KubernetesState => {
          return {
            ...initialState,
            isLoading: true,
          };
        });
      }),
      switchMap(() => this.updatePoolAndKubernetesConfig()),
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
      switchMap(() => this.loadKubernetesStatus()),
      catchError(() => {
        this.handleError();
        return EMPTY;
      }),
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

  updatePoolAndKubernetesConfig(): Observable<KubernetesConfig> {
    return combineLatest([
      this.appsService.getKubernetesConfig(),
      this.appsService.getKubernetesServiceStarted(),
    ]).pipe(
      map(([config, isKubernetesStarted]) => {
        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            kubernetesConfig: { ...config },
            selectedPool: config.pool,
            isKubernetesStarted: config.pool ? isKubernetesStarted : false,
          };
        });
        return config;
      }),
    );
  }

  loadKubernetesStatus(): Observable<KubernetesStatusData> {
    return this.appsService.getKubernetesStatus().pipe(
      tap(({ status, description }: KubernetesStatusData) => {
        this.listenForKubernetesStatusUpdates();

        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            kubernetesStatus: status,
            kubernetesStatusDescription: description,
          };
        });
      }),
    );
  }

  listenForKubernetesStatusUpdates(): ObservableInput<unknown> {
    if (this.kubernetesStatusSubscription) {
      return;
    }

    this.kubernetesStatusSubscription = this.appsService.getKubernetesStatusUpdates().pipe(
      map((event: ApiEvent<KubernetesStatusData>) => {
        this.patchState((state: KubernetesState): KubernetesState => {
          return {
            ...state,
            kubernetesStatus: event.fields.status,
            kubernetesStatusDescription: event.fields.description,
          };
        });
      }),
    ).subscribe();
  }
}
