import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { JobProgressDialogComponent } from 'app/modules/common/dialog/job-progress/job-progress-dialog.component';

export class JobProgressDialog {
  private readonly onSuccess$ = new Subject<Job>();
  private readonly onAbort$ = new Subject<Job>();
  private readonly onFailure$ = new Subject<Job>();
  private readonly _onProgress$ = new Subject<JobProgress>();

  readonly afterSuccess$ = this.onSuccess$.asObservable();
  readonly afterAbort$ = this.onAbort$.asObservable();
  readonly afterFailure$ = this.onFailure$.asObservable();
  readonly onProgress$ = this._onProgress$.asObservable();

  matDialogRef: MatDialogRef<JobProgressDialogComponent>;

  afterSuccess(job: Job): void {
    this.onSuccess$.next(job);
  }

  afterAbort(job: Job): void {
    this.onAbort$.next(job);
  }

  afterFailure(job: Job): void {
    this.onFailure$.next(job);
  }

  onProgress(progress: JobProgress): void {
    this._onProgress$.next(progress);
  }
}
