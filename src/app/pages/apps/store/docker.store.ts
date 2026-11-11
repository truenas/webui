import { Injectable, computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import {
  filter,
  forkJoin, map, Observable, pipe, switchMap, tap,
} from 'rxjs';
import { DockerStatus } from 'app/enums/docker-status.enum';
import {
  DockerConfig, DockerConfigUpdate, DockerStatusData, toDockerStatusData,
} from 'app/interfaces/docker-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface DockerConfigState {
  isLoading: boolean;
  dockerConfig: DockerConfig | null;
  statusData: DockerStatusData | {
    status: null;
    description: null;
  };
}

const initialState: DockerConfigState = {
  isLoading: false,
  dockerConfig: null,
  statusData: {
    status: null,
    description: null,
  },
};

@Injectable()
export class DockerStore {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly dockerConfig = this.state.dockerConfig;
  readonly selectedPool = computed(() => this.state.dockerConfig()?.pool || null);
  readonly status = computed(() => this.state.statusData().status);
  readonly statusDescription = computed(() => this.state.statusData().description);
  readonly isDockerStarted = computed(() => {
    const status = this.status();
    return status == null ? null : DockerStatus.Running === status;
  });

  readonly initialize = rxMethod<void>(pipe(
    // The flag is raised inside the projection: `switchMap` finalizes the request it replaces first,
    // and that would otherwise clear the flag of the request that has just started.
    switchMap(() => {
      patchState(this.state, { isLoading: true });
      return forkJoin([
        this.getDockerConfig(),
        this.getDockerStatus(),
      ]).pipe(
        tapResponse({
          next: ([dockerConfig, statusData]) => patchState(this.state, { dockerConfig, statusData }),
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));

  private getDockerConfig(): Observable<DockerConfig> {
    return this.api.call('docker.config');
  }

  private getDockerStatus(): Observable<DockerStatusData> {
    return this.api.call('docker.status').pipe(map(toDockerStatusData));
  }

  setDockerPool(poolName: string | null, migrateApps?: boolean): Observable<Job<DockerConfig>> {
    const payload: DockerConfigUpdate = {
      pool: poolName,
    };

    if (migrateApps) {
      payload.migrate_applications = migrateApps;
    }

    return this.dialogService.jobDialog(
      this.api.job('docker.update', [payload]),
      { title: this.translate.instant('Configuring apps') },
    )
      .afterClosed()
      .pipe(this.errorHandler.withErrorHandler());
  }

  reloadDockerConfig(): Observable<DockerConfig> {
    return this.getDockerConfig().pipe(
      tap((dockerConfig) => {
        patchState(this.state, { dockerConfig });
      }),
    );
  }

  /**
   * Updates docker status in `DockerStore` service
   * @returns An observable that should be subscribed to at component level. This event subscription should only
   * stay alive until the component subscription stays alive i.e., until the component is destroyed
   */
  dockerStatusEventUpdates(): Observable<DockerStatusData> {
    return this.api.subscribe('docker.state').pipe(
      // Only a change carries the status; `docker.state` sends nothing else.
      filter((event) => event.msg === 'changed'),
      map((event) => toDockerStatusData(event.fields)),
      tap((statusData) => {
        patchState(this.state, { statusData });
      }),
    );
  }

  dockerConfigEventUpdates(): Observable<DockerConfig> {
    return this.api.subscribe('core.get_jobs')
      .pipe(
        filter((event) => event.msg !== 'removed' && event.fields.method === 'docker.update' && !!event.fields.result),
        // The job's result is what `docker.update` returns; the generated job entry types it `unknown`.
        map((event) => (event as { fields: { result: DockerConfig } }).fields.result),
        tap((dockerConfig) => patchState(this.state, { dockerConfig })),
      );
  }
}
