import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

export function getAppStatus(app: App, job?: Job<void, AppStartQueryParams>): AppStatus {
  if (!app) return null;

  let status: AppStatus;

  switch (app.state) {
    case CatalogAppState.Active:
      status = AppStatus.Started;
      break;
    case CatalogAppState.Deploying:
      status = AppStatus.Deploying;
      break;
    case CatalogAppState.Stopped:
      status = AppStatus.Stopped;
      break;
  }

  // TODO: `replica_count` is no longer applicable as we simply call app.start/app.stop to start/stop apps
  // figure out the new way to properly determine if the app is starting or stopping
  // All of the following logic is flawed and needs to be looked at. Especially what replaces the commented section
  if (job) {
    // TODO: `replica_count` is no longer applicable. Figure out what is the replacement for this logic
    // const [, params] = job.arguments;
    if (
      [JobState.Waiting, JobState.Running].includes(job.state)
      // TODO: `replica_count` is no longer applicable. Figure out what is the replacement for this logic
      // && params.replica_count >= 1
    ) {
      status = AppStatus.Starting;
    }
    if (
      [JobState.Waiting, JobState.Running].includes(job.state)
      // TODO: `replica_count` is no longer applicable. Figure out what is the replacement for this logic
      // && params.replica_count === 0
    ) {
      status = AppStatus.Stopping;
    }
    if (
      job.state === JobState.Success
      // TODO: `replica_count` is no longer applicable. Figure out what is the replacement for this logic
      // && params.replica_count >= 1
      && app.state !== CatalogAppState.Deploying
    ) {
      status = AppStatus.Started;
    }
    if (
      job.state === JobState.Success
      // TODO: `replica_count` is no longer applicable. Figure out what is the replacement for this logic
      // && params.replica_count === 0
      && app.state !== CatalogAppState.Deploying
    ) {
      status = AppStatus.Stopped;
    }
  }

  return status;
}
