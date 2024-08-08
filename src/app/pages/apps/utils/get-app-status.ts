import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

export function getAppStatus(app: App, _?: Job<void, AppStartQueryParams>): AppStatus {
  if (!app) return null;

  let status: AppStatus;

  switch (app.state) {
    case CatalogAppState.Running:
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
