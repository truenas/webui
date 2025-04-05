import { Component } from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import {
  merge, Observable, switchMap, take, throwError,
} from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { AbortedJobError } from 'app/services/errors/error.classes';

export class JobProgressDialogRef<T> {
  constructor(
    private readonly matDialogRef: MatDialogRef<JobProgressDialog<T>>,
  ) {}

  afterClosed(): Observable<Job<T>> {
    return merge(
      outputToObservable(this.matDialogRef.componentInstance.jobSuccess),
      outputToObservable(this.matDialogRef.componentInstance.jobAborted).pipe(
        switchMap((job) => throwError(() => new AbortedJobError(job))),
      ),
      outputToObservable(this.matDialogRef.componentInstance.jobFailure)
        .pipe(switchMap((error) => throwError(() => error))),
    ).pipe(take(1));
  }

  getSubscriptionLimiterInstance(): Component {
    return this.matDialogRef.componentInstance as Component;
  }
}
