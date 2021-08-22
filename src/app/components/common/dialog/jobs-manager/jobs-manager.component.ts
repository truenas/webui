import {
  trigger, animate, style, transition, query, stagger,
} from '@angular/animations';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { Job } from 'app/interfaces/job.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-jobs-manager',
  templateUrl: './jobs-manager.component.html',
  styleUrls: ['./jobs-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('list', [
      transition('* <=> *', [
        query(':enter',
          [style({ opacity: 0 }), stagger('60ms', animate('600ms ease-out', style({ opacity: 1 })))],
          { optional: true }),
        query(':leave',
          animate('200ms', style({ opacity: 0 })),
          { optional: true }),
      ]),
    ]),
  ],
})
export class JobsManagerComponent implements OnInit {
  isLoading: boolean;
  jobs: Job[] = [];
  numberOfRunningJobs$ = this.store.numberOfRunningJobs$;
  numberOfFailedJobs$ = this.store.numberOfFailedJobs$;
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: false,
    title: T('No jobs are available.'),
    icon: 'assignment',
    message: T('Click the button below to see all jobs.'),
    button: {
      label: T('History'),
      action: () => {
        this.router.navigate(['/jobs']);
      },
    },
  };

  constructor(
    private router: Router,
    private store: JobsManagerStore,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<JobsManagerComponent>,
    private translate: TranslateService,
  ) {
    this.isLoading = true;
  }

  ngOnInit(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.isLoading = state.isLoading;
      this.jobs = state.jobs;
      this.cdr.markForCheck();
    });
  }

  onAbort(job: Job): void {
    this.store.remove(job);
  }

  openDialog(job: Job): void {
    const title = this.translate.instant(T('Updating'));
    const jobDialogRef = this.dialog.open(EntityJobComponent, {
      data: { title },
      disableClose: true,
      hasBackdrop: true,
      width: '400px',
    });

    jobDialogRef.componentInstance.jobId = job.id;
    jobDialogRef.componentInstance.autoCloseOnSuccess = true;
    jobDialogRef.componentInstance.wsshow();

    this.dialogRef.close();
  }
}
