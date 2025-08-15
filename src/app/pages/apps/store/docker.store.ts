import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter,
  forkJoin, map, Observable, switchMap, tap,
} from 'rxjs';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { DockerConfig, DockerStatusData } from 'app/interfaces/docker-config.interface';
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
export class DockerStore extends ComponentStore<DockerConfigState> {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly dockerConfig$ = this.select((state) => state.dockerConfig);
  readonly selectedPool$ = this.select((state) => state.dockerConfig?.pool || null);
  readonly isDockerStarted$ = this.select((state) => {
    return state.statusData.status == null ? null : DockerStatus.Running === state.statusData.status;
  });

  readonly status$ = this.select((state) => state.statusData.status);
  readonly statusDescription$ = this.select((state) => state.statusData.description);

  constructor() {
    super(initialState);
  }

  initialize = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() => forkJoin([
        this.getDockerConfig(),
        this.getDockerStatus(),
      ])),
      tap(
        ([dockerConfig, statusData]: [DockerConfig, DockerStatusData]) => {
          this.patchState({
            dockerConfig,
            statusData,
            isLoading: false,
          });
        },
      ),
      this.errorHandler.withErrorHandler(),
    );
  });

  private getDockerConfig(): Observable<DockerConfig> {
    return this.api.call('docker.config');
  }

  private getDockerStatus(): Observable<DockerStatusData> {
    return this.api.call('docker.status');
  }

  setDockerPool(poolName: string | null, migrateApps?: boolean): Observable<Job<DockerConfig>> {
    const payload = {
      pool: poolName,
    } as DockerConfig;

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
        this.patchState({ dockerConfig });
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
      map((event) => event.fields),
      tap((statusData) => {
        this.patchState({ statusData });
      }),
    );
  }

  dockerConfigEventUpdates(): Observable<DockerConfig> {
    return this.api.subscribe('core.get_jobs')
      .pipe(
        filter((event) => event.fields.method === 'docker.update' && !!event.fields.result),
        map((event) => event.fields.result),
        tap((dockerConfig: DockerConfig) => this.patchState({ dockerConfig })),
      );
  }
}
