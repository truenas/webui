import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { jobsElements } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.elements';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-jobs-indicator',
  templateUrl: './jobs-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonDirectivesModule,
    MatIconButton,
    TestIdModule,
    MatBadge,
    MatTooltip,
    IxIconModule,
    AsyncPipe,
    TranslateModule,
  ],
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
