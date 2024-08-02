import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleResult, ChartScaleQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

export function getAppStatus(app: App, job?: Job<ChartScaleResult, ChartScaleQueryParams>): AppStatus {
  if (!app) return null;

  let status: AppStatus;

  switch (app.status) {
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

  if (job) {
    const [, params] = job.arguments;
    if ([JobState.Waiting, JobState.Running].includes(job.state) && params.replica_count >= 1) {
      status = AppStatus.Starting;
    }
    if ([JobState.Waiting, JobState.Running].includes(job.state) && params.replica_count === 0) {
      status = AppStatus.Stopping;
    }
    if (
      job.state === JobState.Success
          && params.replica_count >= 1
          && app.status !== ChartReleaseStatus.Deploying
    ) {
      status = AppStatus.Started;
    }
    if (
      job.state === JobState.Success
          && params.replica_count === 0
          && app.status !== ChartReleaseStatus.Deploying
    ) {
      status = AppStatus.Stopped;
    }
  }

  return status;
}
