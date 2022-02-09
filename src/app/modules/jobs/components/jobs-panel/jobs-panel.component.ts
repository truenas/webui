import {
  Component, ChangeDetectionStrategy, TrackByFunction,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { abortJobPressed, jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import {
  JobSlice, selectJobState, selectRunningJobsCount, selectWaitingJobsCount, selectFailedJobsCount, selectJobsPanelSlice,
} from 'app/modules/jobs/store/job.selectors';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-jobs-panel',
  templateUrl: './jobs-panel.component.html',
  styleUrls: ['./jobs-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsPanelComponent {
  isLoading$ = this.store$.select(selectJobState).pipe(map((state) => state.isLoading));
  error$ = this.store$.select(selectJobState).pipe(map((state) => state.error));
  runningJobsCount$ = this.store$.select(selectRunningJobsCount);
  waitingJobsCount$ = this.store$.select(selectWaitingJobsCount);
  failedJobsCount$ = this.store$.select(selectFailedJobsCount);
  availableJobs$ = this.store$.select(selectJobsPanelSlice);

  readonly trackByJobId: TrackByFunction<Job> = (_, job) => job.id;

  constructor(
    private router: Router,
    private store$: Store<JobSlice>,
    private dialogRef: MatDialogRef<JobsPanelComponent>,
    private translate: TranslateService,
    private dialog: DialogService,
    private matDialog: MatDialog,
  ) {
  }

  onAbort(job: Job): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Abort'),
        cancelMsg: this.translate.instant('Cancel'),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.store$.dispatch(abortJobPressed({ job }));
      });
  }

  openEntityJobDialog(job: Job): void {
    this.dialogRef.close();
    let title = job.description ? job.description : job.method;
    if (job.state === JobState.Running) {
      title = this.translate.instant('Updating');
    }
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title },
      hasBackdrop: true,
      width: '400px',
    });

    dialogRef.componentInstance.jobId = job.id;
    dialogRef.componentInstance.autoCloseOnSuccess = true;
    dialogRef.componentInstance.openJobsManagerOnClose = false;
    dialogRef.componentInstance.wsshow();
  }

  goToJobs(): void {
    this.dialogRef.close();
    this.store$.dispatch(jobPanelClosed());
    this.router.navigate(['/jobs']);
  }
}
