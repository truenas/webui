import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { Job } from 'app/interfaces/job.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-jobs-manager',
  templateUrl: './jobs-manager.component.html',
  styleUrls: ['./jobs-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsManagerComponent implements OnInit {
  isLoading: boolean;
  jobs: Job[] = [];
  runningJobs: number;
  failedJobs: number;
  emptyConfig: EmptyConfig = {
    type: EmptyType.no_page_data,
    large: false,
    title: T('No jobs are available.'),
    icon: 'assignment',
    /* TODO: NAS-111291 - Uncomment when job list is implemented
    message: T('Click the button below to see all jobs.'),
    button: {
      label: T('History'),
      action: () => {
        this.router.navigate(['/path/to/job/list']);
        console.warn('Not implemented yet.');
      },
    },
    */
  };

  constructor(
    /* private router: Router, */
    private ws: WebSocketService,
    private store: JobsManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.isLoading = state.isLoading;
      this.jobs = state.jobs;
      this.runningJobs = state.runningJobs;
      this.failedJobs = state.failedJobs;
      this.cdr.markForCheck();
    });
  }

  onAbort(job: Job): void {
    this.store.remove(job);
  }
}
