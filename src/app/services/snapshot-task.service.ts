import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PeriodicSnapshotTaskUpdate } from 'app/interfaces/periodic-snapshot-task.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class SnapshotTaskService {
  private api = inject(ApiService);

  /**
   * Checks if a snapshot task has associated snapshots that would be affected by deletion.
   * @param taskId - The ID of the snapshot task to check
   * @returns Observable<boolean> - true if the task has snapshots that would be affected
   */
  checkTaskHasSnapshots(taskId: number): Observable<boolean> {
    // cspell:ignore snapshottask
    return this.api.call('pool.snapshottask.delete_will_change_retention_for', [taskId]).pipe(
      map((affectedSnapshots) => {
        const allSnapshots = Object.values(affectedSnapshots).flat();
        return allSnapshots.length > 0;
      }),
    );
  }

  /**
   * Checks if updating a snapshot task will change retention for existing snapshots.
   * @param taskId - The ID of the snapshot task to check
   * @param update - The update parameters to check
   * @returns Observable<string[]> - Array of snapshot names that would be affected
   */
  checkUpdateWillChangeRetention(
    taskId: number,
    update: PeriodicSnapshotTaskUpdate,
  ): Observable<string[]> {
    // cspell:ignore snapshottask
    return this.api.call('pool.snapshottask.update_will_change_retention_for', [taskId, update]).pipe(
      map((response) => Object.values(response).flat()),
    );
  }
}
