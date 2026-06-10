import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatBadge } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { helptextTopbar } from 'app/helptext/topbar';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { jobsElements } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.elements';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { AppState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

@Component({
  selector: 'ix-jobs-indicator',
  styleUrls: ['./jobs-indicator.component.scss'],
  templateUrl: './jobs-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    MatBadge,
    TranslateModule,
    UiSearchDirective,
  ],
})
export class JobsIndicatorComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  tooltips = helptextTopbar.tooltips;

  protected readonly jobBadgeCount = toSignal(this.store$.select(selectRunningJobsCount), { initialValue: 0 });
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
