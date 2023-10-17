import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { JobProgressDialogComponent } from 'app/modules/common/dialog/job-progress/job-progress-dialog.component';

export class JobProgressDialog {
  private readonly success$ = new Subject<Job>();
  private readonly abort$ = new Subject<Job>();
  private readonly failure$ = new Subject<Job>();
  private readonly progress$ = new Subject<JobProgress>();

  readonly afterSuccess$ = this.success$.asObservable();
  readonly afterAbort$ = this.abort$.asObservable();
  readonly afterFailure$ = this.failure$.asObservable();
  readonly onProgress$ = this.progress$.asObservable();

  matDialogRef: MatDialogRef<JobProgressDialogComponent>;

  success(job: Job): void {
    this.success$.next(job);
  }

  abort(job: Job): void {
    this.abort$.next(job);
  }

  failure(job: Job): void {
    this.failure$.next(job);
  }

  progress(progress: JobProgress): void {
    this.progress$.next(progress);
  }
}
