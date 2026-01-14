import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.api.call('pool.snapshottask.delete_will_change_retention_for', [taskId]).pipe(
      map((affectedSnapshots) => {
        const allSnapshots = Object.values(affectedSnapshots).flat();
        return allSnapshots.length > 0;
      }),
    );
  }
}
