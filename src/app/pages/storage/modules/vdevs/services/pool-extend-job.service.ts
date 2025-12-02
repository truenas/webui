import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class PoolExtendJobService {
  private api = inject(ApiService);

  /**
   * Checks if there's an existing pool.attach job running or waiting for the specified pool.
   * @param poolId The ID of the pool to check
   * @returns Observable<boolean> - true if a job exists, false otherwise
   */
  checkForExistingExtendJob(poolId: number): Observable<boolean> {
    return this.api.call('core.get_jobs', [[
      ['method', '=', 'pool.attach'],
      ['state', 'in', [JobState.Running, JobState.Waiting]],
    ]]).pipe(
      // Job result type is unknown because we're checking jobs before completion
      map((jobs: Job<unknown, [number, PoolAttachParams]>[]) => {
        // Check if any job is for the same pool
        return jobs.some((job) => job.arguments[0] === poolId);
      }),
      // Fail-open: if job check fails, allow operation to proceed
      catchError(() => of(false)),
    );
  }
}
