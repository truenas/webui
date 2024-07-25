import {
  computed, Injectable, signal, WritableSignal,
} from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable, tap } from 'rxjs';
import { DockerConfig, DockerStatusResponse } from 'app/enums/docker-config.interface';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable()
export class DockerService {
  private readonly dockerPool: WritableSignal<string> = signal<string>(null);

  readonly selectedPool = computed(() => {
    return this.dockerPool();
  });

  constructor(
    private ws: WebSocketService,
  ) {
    this.getDockerConfig().pipe(
      untilDestroyed(this),
    ).subscribe();
  }

  getDockerConfig(): Observable<DockerConfig> {
    return this.ws.call('docker.config').pipe(
      tap((dockerConfig) => {
        this.dockerPool.set(dockerConfig.pool);
      }),
    );
  }

  getDockerStatus(): Observable<DockerStatusResponse> {
    return this.ws.call('docker.status');
  }

  setupDockerUpdateJob(pool: string): Observable<Job<DockerConfig>> {
    return this.ws.job('docker.update', { pool }).pipe(
      tap((job) => {
        if (job.state === JobState.Success) {
          this.dockerPool.set(job.result.pool);
        }
      }),
    );
  }

  getDockerUpdates(): Observable<ApiEvent<DockerStatusResponse>> {
    return this.ws.subscribe('docker.state');
  }
}
