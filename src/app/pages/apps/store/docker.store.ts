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
  nvidiaDriversInstalled: boolean;
  lacksNvidiaDrivers: boolean;
  statusData: {
    status: string;
    description: string;
  };
}

const initialState: DockerConfigState = {
  isLoading: false,
  pool: null,
  nvidiaDriversInstalled: false,
  lacksNvidiaDrivers: false,
  statusData: {
    status: null,
    description: null,
  },
};

@Injectable()
export class DockerStore extends ComponentStore<DockerConfigState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly selectedPool$ = this.select((state) => state.pool);
  readonly nvidiaDriversInstalled$ = this.select((state) => state.nvidiaDriversInstalled);
  readonly lacksNvidiaDrivers$ = this.select((state) => state.lacksNvidiaDrivers);
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
        this.patchState({
          isLoading: true,
        });
      }),
      switchMap(() => forkJoin([
        this.getDockerConfig(),
        this.getDockerStatus(),
        this.getLacksNvidiaDriversValue(),
      ])),
      tap(
        ([dockerConfig, dockerStatus, lacksNvidiaDrivers]: [DockerConfig, DockerStatusResponse, boolean]) => {
          this.patchState({
            pool: dockerConfig.pool,
            nvidiaDriversInstalled: dockerConfig.nvidia,
            lacksNvidiaDrivers,
            statusData: {
              status: dockerStatus.status,
              description: dockerStatus.description,
            },
            isLoading: false,
          });
        },
      ),
    );
  });

  private getDockerConfig(): Observable<DockerConfig> {
    return this.ws.call('docker.config');
  }

  private getLacksNvidiaDriversValue(): Observable<boolean> {
    return this.ws.call('docker.lacks_nvidia_drivers');
  }

  private getDockerStatus(): Observable<DockerStatusResponse> {
    return this.ws.call('docker.status');
  }

  setDockerPool(poolName: string): Observable<Job<DockerConfig>> {
    return this.dialogService.jobDialog(
      this.ws.job('docker.update', [{ pool: poolName }]),
      { title: this.translate.instant('Configuring...') },
    )
      .afterClosed()
      .pipe(
        tap((job) => {
          if (job.state === JobState.Success) {
            this.patchState({
              pool: poolName,
            });
          } else if ([JobState.Failed, JobState.Aborted, JobState.Error].includes(job.state)) {
            this.patchState({
              pool: null,
            });
          }
        }),
        this.errorHandler.catchError(),
      );
  }

  setNvidiaValue(nvidiaDriversInstalled: boolean): Observable<Job<DockerConfig>> {
    return this.dialogService.jobDialog(
      this.ws.job('docker.update', [{ nvidia: nvidiaDriversInstalled }]),
      { title: this.translate.instant('Configuring...') },
    )
      .afterClosed()
      .pipe(
        tap((job) => {
          if (job.state === JobState.Success) {
            this.patchState({
              nvidiaDriversInstalled,
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
        this.patchState({
          statusData: {
            status: dockerState.fields.status,
            description: dockerState.fields.description,
          },
        });
      }),
    );
  }
}
