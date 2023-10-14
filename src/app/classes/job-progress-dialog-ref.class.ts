import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { JobProgressDialog } from 'app/classes/job-progress-dialog.class';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { JobProgressDialogComponent } from 'app/modules/common/dialog/job-progress/job-progress-dialog.component';

export class JobProgressDialogRef {
  constructor(private readonly jobProgressDialog: JobProgressDialog) { }

  getDialogRef(): MatDialogRef<JobProgressDialogComponent> {
    return this.jobProgressDialog.matDialogRef;
  }

  onSuccess(): Observable<Job> {
    return this.jobProgressDialog.afterSuccess$;
  }

  onAbort(): Observable<Job> {
    return this.jobProgressDialog.afterAbort$;
  }

  onFailure(): Observable<Job> {
    return this.jobProgressDialog.afterFailure$;
  }

  onProgressUpdate(): Observable<JobProgress> {
    return this.jobProgressDialog.onProgress$;
  }

  onClose(): Observable<unknown> {
    return this.jobProgressDialog.matDialogRef.afterClosed();
  }
}