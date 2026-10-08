import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

@Injectable({
  providedIn: 'root',
})
export class PoolExtendJobService {
  private api = inject(TypedApiService);

  /**
   * Checks if there's an existing pool.attach job running or waiting for the specified pool.
   * @param poolId The ID of the pool to check
   * @returns Observable<boolean> - true if a job exists, false otherwise
   */
  checkForExistingExtendJob(poolId: number): Observable<boolean> {
    return this.api.query('core.get_jobs', [
      ['method', '=', 'pool.attach'],
      ['state', 'in', [JobState.Running, JobState.Waiting]],
    ]).pipe(
      // A `pool.attach` job's first argument is the pool's id.
      map((jobs) => jobs.some((job) => job.arguments[0] === poolId)),
      // Fail-open: if job check fails, allow operation to proceed
      catchError(() => of(false)),
    );
  }
}
