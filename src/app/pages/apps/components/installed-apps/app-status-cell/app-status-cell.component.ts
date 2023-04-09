import {
  Component, EventEmitter, HostBinding, Input, Output,
} from '@angular/core';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus, appStatusLabels } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-status-cell',
  templateUrl: './app-status-cell.component.html',
  styleUrls: ['./app-status-cell.component.scss'],
})
export class AppStatusCellComponent {
  @Input() app: ChartRelease;
  @Input() job: Job<ChartScaleResult, ChartScaleQueryParams>;
  @Output() statusChanged = new EventEmitter<AppStatus>();
  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.appStatus.toLowerCase()];
  }

  protected appStatusLabels = appStatusLabels;

  get appStatus(): AppStatus {
    let status: AppStatus;

    switch (this.app.status) {
      case ChartReleaseStatus.Active:
        status = AppStatus.Started;
        break;
      case ChartReleaseStatus.Deploying:
        status = AppStatus.Deploying;
        break;
      case ChartReleaseStatus.Stopped:
        status = AppStatus.Stopped;
        break;
    }

    if (this.job) {
      const [, params] = this.job.arguments;
      if (this.job.state === JobState.Running && params.replica_count === 1) {
        status = AppStatus.Starting;
      }
      if (this.job.state === JobState.Running && params.replica_count === 0) {
        status = AppStatus.Stopping;
      }
      if (this.job.state === JobState.Success && params.replica_count === 1) {
        status = AppStatus.Started;
      }
      if (this.job.state === JobState.Success && params.replica_count === 0) {
        status = AppStatus.Stopped;
      }
    }

    return status;
  }

  get inProgress(): boolean {
    return [
      AppStatus.Deploying,
      AppStatus.Starting,
      AppStatus.Stopping,
    ].includes(this.appStatus);
  }
}
