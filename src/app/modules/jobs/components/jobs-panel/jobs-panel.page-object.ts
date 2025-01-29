import { Spectator } from '@ngneat/spectator';
import { queryAllNestedDirectives } from 'app/core/testing/utils/query-all-nested-directives.utils';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';

export class JobsPanelPageObject {
  constructor(private spectator: Spectator<JobsPanelComponent>) {}

  get getJobItemComponents(): JobItemComponent[] {
    return queryAllNestedDirectives(this.spectator.debugElement, this.jobsListSection, JobItemComponent);
  }

  get title(): HTMLElement | null {
    return this.spectator.query('.jobs-header h3');
  }

  get runningBadgeCount(): HTMLElement | null {
    return this.spectator.query('.job-badge.running .job-badge-count');
  }

  get waitingBadgeCount(): HTMLElement | null {
    return this.spectator.query('.job-badge.waiting .job-badge-count');
  }

  get failedBadgeCount(): HTMLElement | null {
    return this.spectator.query('.job-badge.failed .job-badge-count');
  }

  get jobsListSection(): HTMLElement | null {
    return this.spectator.query('.jobs-list');
  }
}
