import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter,
  forkJoin, map, Observable, switchMap, tap,
} from 'rxjs';
import { DockerConfig, DockerStatusData } from 'app/enums/docker-config.interface';
import { DockerNvidiaStatus } from 'app/enums/docker-nvidia-status.enum';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface DockerConfigState {
  isLoading: boolean;
  dockerConfig: DockerConfig;
  nvidiaDriversInstalled: boolean;
  nvidiaStatus: DockerNvidiaStatus;
  statusData: DockerStatusData;
}

const initialState: DockerConfigState = {
  isLoading: false,
  dockerConfig: null,
  nvidiaDriversInstalled: false,
  nvidiaStatus: null,
  statusData: {
    status: null,
    description: null,
  },
};

@Injectable()
export class DockerStore extends ComponentStore<DockerConfigState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly dockerConfig$ = this.select((state) => state.dockerConfig);
  readonly selectedPool$ = this.select((state) => state.dockerConfig?.pool || null);
  readonly nvidiaDriversInstalled$ = this.select((state) => state.nvidiaDriversInstalled);
  readonly hasNvidiaCard$ = this.select((state) => state.nvidiaStatus !== DockerNvidiaStatus.Absent);
  readonly dockerNvidiaStatus$ = this.select((state) => state.nvidiaStatus);
  readonly isDockerStarted$ = this.select((state) => {
    return state.statusData.status == null ? null : DockerStatus.Running === state.statusData.status;
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
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() => forkJoin([
        this.getDockerConfig(),
        this.getDockerStatus(),
        this.getDockerNvidiaStatus(),
      ])),
      tap(
        ([dockerConfig, statusData, nvidiaStatus]: [DockerConfig, DockerStatusData, DockerNvidiaStatus]) => {
          this.patchState({
            dockerConfig,
            nvidiaDriversInstalled: dockerConfig.nvidia,
            nvidiaStatus,
            statusData,
            isLoading: false,
          });
        },
      ),
    );
  });

  private getDockerConfig(): Observable<DockerConfig> {
    return this.ws.call('docker.config');
  }

  private getDockerNvidiaStatus(): Observable<DockerNvidiaStatus> {
    return this.ws.call('docker.nvidia_status').pipe(map(({ status }) => status));
  }

  private getDockerStatus(): Observable<DockerStatusData> {
    return this.ws.call('docker.status');
  }

  setDockerPool(poolName: string): Observable<Job<DockerConfig>> {
    return this.dialogService.jobDialog(
      this.ws.job('docker.update', [{ pool: poolName }]),
      { title: this.translate.instant('Configuring...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError());
  }

  reloadDockerConfig(): Observable<DockerConfig> {
    return this.getDockerConfig().pipe(
      tap((dockerConfig) => {
        this.patchState({ dockerConfig });
      }),
    );
  }

  reloadDockerNvidiaStatus(): Observable<DockerNvidiaStatus> {
    return this.getDockerNvidiaStatus().pipe(
      tap((nvidiaStatus) => {
        this.patchState({ nvidiaStatus });
      }),
    );
  }

  setDockerNvidia(nvidiaDriversInstalled: boolean): Observable<Job<DockerConfig>> {
    return this.dialogService.jobDialog(
      this.ws.job('docker.update', [{ nvidia: nvidiaDriversInstalled }]),
      { title: this.translate.instant('Configuring...') },
    )
      .afterClosed()
      .pipe(
        tap((job) => {
          if (job.state === JobState.Success) {
            this.patchState({ nvidiaDriversInstalled });
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
  dockerStatusEventUpdates(): Observable<DockerStatusData> {
    return this.ws.subscribe('docker.state').pipe(
      map((event) => event.fields),
      tap((statusData) => {
        this.patchState({ statusData });
      }),
    );
  }

  dockerConfigEventUpdates(): Observable<DockerConfig> {
    return this.ws.subscribe('core.get_jobs')
      .pipe(
        filter((event) => event.fields.method === 'docker.update' && !!event.fields.result),
        map((event) => event.fields.result),
        tap((dockerConfig: DockerConfig) => this.patchState({ dockerConfig })),
      );
  }
}
