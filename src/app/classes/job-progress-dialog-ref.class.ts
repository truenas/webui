import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  merge, Observable, switchMap, take, throwError,
} from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { JobProgressDialogComponent } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';

export class JobProgressDialogRef<T> {
  constructor(
    readonly matDialogRef: MatDialogRef<JobProgressDialogComponent<T>>,
    readonly translate: TranslateService,
  ) {}

  afterClosed(): Observable<Job<T>> {
    return merge(
      this.matDialogRef.componentInstance.jobSuccess,
      this.matDialogRef.componentInstance.jobAborted.pipe(
        switchMap(() => throwError(() => new Error(this.translate.instant('Job aborted')))),
      ),
      this.matDialogRef.componentInstance.jobFailure.pipe(switchMap((error) => throwError(() => error))),
    ).pipe(take(1));
  }
}
