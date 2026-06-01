import { DialogRef } from '@angular/cdk/dialog';
import { DestroyRef } from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import {
  merge, Observable, switchMap, take, throwError,
} from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { AbortedJobError } from 'app/services/errors/error.classes';

export class JobProgressDialogRef<T> {
  constructor(
    private readonly dialogRef: DialogRef<void, JobProgressDialog<T>>,
  ) {}

  afterClosed(): Observable<Job<T>> {
    const componentInstance = this.dialogRef.componentInstance;
    if (!componentInstance) {
      throw new Error('JobProgressDialogRef: componentInstance is not available.');
    }
    return merge(
      outputToObservable(componentInstance.jobSuccess),
      outputToObservable(componentInstance.jobAborted).pipe(
        switchMap((job) => throwError(() => new AbortedJobError(job))),
      ),
      outputToObservable(componentInstance.jobFailure)
        .pipe(switchMap((error) => throwError(() => error))),
    ).pipe(take(1));
  }

  getDestroyRef(): DestroyRef {
    const componentInstance = this.dialogRef.componentInstance;
    if (!componentInstance) {
      throw new Error('JobProgressDialogRef: componentInstance is not available.');
    }
    return componentInstance.destroyRef;
  }
}
