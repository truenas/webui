import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

export function getAppStatus(app: App, _?: Job<void, AppStartQueryParams>): AppStatus {
  if (!app) return null;

  return app.state as unknown as AppStatus;
}
