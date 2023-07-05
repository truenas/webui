import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRowComponent {
  @Input() app: ChartRelease;
  @Input() job?: Job<ChartScaleResult, ChartScaleQueryParams>;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Output() clickStatus = new EventEmitter<void>();

  get hasUpdates(): boolean {
    return this.app.update_available || this.app.container_images_update_available;
  }

  get isAppStopped(): boolean {
    return this.app.status === ChartReleaseStatus.Stopped;
  }

  get inProgress(): boolean {
    return [
      AppStatus.Deploying,
      AppStatus.Starting,
      AppStatus.Stopping,
    ].includes(this.appStatus);
  }

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
      if (this.job.state === JobState.Running && params.replica_count >= 1) {
        status = AppStatus.Starting;
      }
      if (this.job.state === JobState.Running && params.replica_count === 0) {
        status = AppStatus.Stopping;
      }
      if (this.job.state === JobState.Success && params.replica_count >= 1) {
        status = AppStatus.Started;
      }
      if (this.job.state === JobState.Success && params.replica_count === 0) {
        status = AppStatus.Stopped;
      }
    }

    return status;
  }

  toggleAppChecked(checked: boolean): void {
    this.app.selected = checked;
  }

  start(): void {
    this.startApp.emit();
  }

  stop(): void {
    this.stopApp.emit();
  }

  statusPressed(): void {
    this.clickStatus.emit();
  }
}
