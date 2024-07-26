import {
  computed, Injectable,
} from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { DockerConfig, DockerStatusResponse } from 'app/enums/docker-config.interface';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { WebSocketService } from 'app/services/ws.service';

export interface DockerConfigState {
  isLoading: boolean;
  pool: string;
  statusData: {
    status: string;
    description: string;
  };
}

const initialState: DockerConfigState = {
  isLoading: false,
  pool: null,
  statusData: {
    status: null,
    description: null,
  },
};

@Injectable()
export class DockerStore extends ComponentStore<DockerConfigState> {
  readonly isLoading = computed(() => {
    return this.state().isLoading;
  });

  readonly selectedPool = computed(() => {
    return this.state().pool;
  });

  readonly dockerStarted = computed(() => {
    return [
      DockerStatus.Initializing,
      DockerStatus.Pending,
      DockerStatus.Running,
    ].includes(this.state().statusData.status as DockerStatus);
  });

  readonly status = computed(() => {
    return this.state().statusData.status;
  });

  readonly statusDescription = computed(() => {
    return this.state().statusData.description;
  });

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
    this.initialize();
  }

  private initialize = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState((state) => {
          return {
            ...state,
            isLoading: true,
          };
        });
      }),
      switchMap(() => this.getDockerConfig()),
      tap((dockerConfig: DockerConfig) => {
        this.patchState((state) => {
          return {
            ...state,
            pool: dockerConfig.pool,
          };
        });
      }),
      switchMap(() => this.getDockerStatus()),
      tap((dockerStatus: DockerStatusResponse) => {
        this.patchState((state) => {
          return {
            ...state,
            statusData: {
              status: dockerStatus.status,
              description: dockerStatus.description,
            },
          };
        });
      }),
      tap(() => {
        this.patchState((state) => {
          return {
            ...state,
            isLoading: false,
          };
        });
      }),
    );
  });

  getDockerConfig(): Observable<DockerConfig> {
    return this.ws.call('docker.config');
  }

  getDockerStatus(): Observable<DockerStatusResponse> {
    return this.ws.call('docker.status');
  }

  setDockerPool = this.updater((state: DockerConfigState, pool: string) => {
    return {
      ...state,
      pool,
    };
  });

  /**
   * Updates docker status in `DockerStore` service
   * @returns An onservable that should be subscribed to at component level. This event subscription should only
   * stay alive until the component subscription stays alive i.e., until the component is destroyed
   */
  dockerStatusEventUpdates(): Observable<ApiEvent<DockerStatusResponse>> {
    return this.ws.subscribe('docker.state').pipe(
      tap((dockerState) => {
        this.patchState((state) => {
          return {
            ...state,
            statusData: {
              status: dockerState.fields.status,
              description: dockerState.fields.description,
            },
          };
        });
      }),
    );
  }
}
