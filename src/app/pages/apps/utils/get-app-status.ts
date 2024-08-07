import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

export function getAppStatus(app: App, _?: Job<void, AppStartQueryParams>): AppStatus {
  if (!app) return null;

  let status: AppStatus;

  switch (app.state) {
    case CatalogAppState.Active:
      status = AppStatus.Running;
      break;
    case CatalogAppState.Deploying:
      status = AppStatus.Deploying;
      break;
    case CatalogAppState.Stopped:
      status = AppStatus.Stopped;
      break;
  }

  return status;
}
