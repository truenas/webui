import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin, Observable, switchMap, tap,
} from 'rxjs';
import { DockerConfig, DockerStatusResponse } from 'app/enums/docker-config.interface';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly selectedPool$ = this.select((state) => state.pool);
  readonly isDockerStarted$ = this.select((state) => {
    return [
      DockerStatus.Initializing,
      DockerStatus.Pending,
      DockerStatus.Running,
    ].includes(state.statusData.status as DockerStatus);
  });
  readonly status$ = this.select((state) => state.statusData.status);
  readonly statusDescription$ = this.select((state) => state.statusData.description);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  initialize = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState((state) => {
          return {
            ...state,
            isLoading: true,
          };
        });
      }),
      switchMap(() => forkJoin([
        this.getDockerConfig(),
        this.getDockerStatus(),
      ])),
      tap(
        ([dockerConfig, dockerStatus]: [DockerConfig, DockerStatusResponse]) => {
          this.patchState((state) => {
            return {
              ...state,
              pool: dockerConfig.pool,
              statusData: {
                status: dockerStatus.status,
                description: dockerStatus.description,
              },
              isLoading: false,
            };
          });
        },
      ),
    );
  });

  private getDockerConfig(): Observable<DockerConfig> {
    return this.ws.call('docker.config');
  }

  private getDockerStatus(): Observable<DockerStatusResponse> {
    return this.ws.call('docker.status');
  }

  setDockerPool(poolName: string): Observable<DockerConfig | Job<DockerConfig>> {
    return this.dialogService.jobDialog(
      this.ws.job('docker.update', [{ pool: poolName }]),
      { title: this.translate.instant('Configuring...') },
    )
      .afterClosed()
      .pipe(
        tap((job) => {
          if (job.state === JobState.Success) {
            this.setState((state) => {
              return {
                ...state,
                pool: poolName,
              };
            });
          }
          if ([JobState.Failed, JobState.Aborted, JobState.Error].includes(job.state)) {
            this.setState((state) => {
              return {
                ...state,
                pool: null,
              };
            });
          }
        }),
        this.errorHandler.catchError(),
      );
  }

  /**
   * Updates docker status in `DockerStore` service
   * @returns An observable that should be subscribed to at component level. This event subscription should only
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
