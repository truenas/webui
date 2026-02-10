import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { helptextTopbar } from 'app/helptext/topbar';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { jobsElements } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.elements';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

@Component({
  selector: 'ix-jobs-indicator',
  styleUrls: ['./jobs-indicator.component.scss'],
  templateUrl: './jobs-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatBadge,
    MatTooltip,
    TnIconComponent,
    AsyncPipe,
    TranslateModule,
    UiSearchDirective,
    TestDirective,
  ],
})
export class JobsIndicatorComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  tooltips = helptextTopbar.tooltips;

  jobBadgeCount$ = this.store$.select(selectRunningJobsCount);
  isJobPanelOpen$ = this.store$.select(selectIsJobPanelOpen);
  protected readonly searchableElements = jobsElements;

  ngOnInit(): void {
    this.setupJobPanelListener();
  }

  onIndicatorPressed(): void {
    this.store$.dispatch(jobIndicatorPressed());
  }

  private onJobPanelClosed(): void {
    this.store$.dispatch(jobPanelClosed());
  }

  private setupJobPanelListener(): void {
    this.isJobPanelOpen$.pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const jobsPanelRef = this.matDialog.open(JobsPanelComponent, {
        width: '420px',
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: topbarDialogPosition,
      });

      jobsPanelRef
        .beforeClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.onJobPanelClosed();
        });
    });
  }
}
