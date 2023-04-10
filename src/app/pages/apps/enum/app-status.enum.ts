import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppStatus {
  Started = 'STARTED',
  Starting = 'STARTING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
}

export const appStatusLabels = new Map<AppStatus, string>([
  [AppStatus.Started, T('Running')],
  [AppStatus.Starting, T('Starting')],
  [AppStatus.Deploying, T('Deploying')],
  [AppStatus.Stopped, T('Stopped')],
  [AppStatus.Stopping, T('Stopping')],
]);
