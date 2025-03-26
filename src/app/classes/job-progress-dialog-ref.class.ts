import { Component } from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import {
  merge, Observable, switchMap, take, throwError,
} from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';

export class JobProgressDialogRef<T> {
  constructor(
    private readonly matDialogRef: MatDialogRef<JobProgressDialog<T>>,
    private readonly translate: TranslateService,
  ) {}

  afterClosed(): Observable<Job<T>> {
    return merge(
      outputToObservable(this.matDialogRef.componentInstance.jobSuccess),
      outputToObservable(this.matDialogRef.componentInstance.jobAborted).pipe(
        switchMap(() => throwError(() => new Error(this.translate.instant('Job aborted')))),
      ),
      outputToObservable(this.matDialogRef.componentInstance.jobFailure)
        .pipe(switchMap((error) => throwError(() => error))),
    ).pipe(take(1));
  }

  getSubscriptionLimiterInstance(): Component {
    return this.matDialogRef.componentInstance as Component;
  }
}
