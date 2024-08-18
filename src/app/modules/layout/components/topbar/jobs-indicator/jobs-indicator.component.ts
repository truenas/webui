import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { helptextTopbar } from 'app/helptext/topbar';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { jobsElements } from 'app/modules/layout/components/topbar/jobs-indicator/jobs-indicator.elements';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { AppsState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-jobs-indicator',
  templateUrl: './jobs-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsIndicatorComponent implements OnInit {
  tooltips = helptextTopbar.mat_tooltips;

  jobBadgeCount$ = this.store$.select(selectRunningJobsCount);
  isJobPanelOpen$ = this.store$.select(selectIsJobPanelOpen);
  protected readonly searchableElements = jobsElements;

  constructor(
    private matDialog: MatDialog,
    private store$: Store<AppsState>,
  ) { }

  ngOnInit(): void {
    this.setupJobPanelListener();
  }

  onIndicatorPressed(): void {
    this.store$.dispatch(jobIndicatorPressed());
  }

  onJobPanelClosed(): void {
    this.store$.dispatch(jobPanelClosed());
  }

  private setupJobPanelListener(): void {
    this.isJobPanelOpen$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const jobsPanelRef = this.matDialog.open(JobsPanelComponent, {
        width: '400px',
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: topbarDialogPosition,
      });

      jobsPanelRef
        .beforeClosed()
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.onJobPanelClosed();
        });
    });
  }
}
