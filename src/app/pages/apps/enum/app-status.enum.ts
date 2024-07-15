import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppStatus {
  Started = 'STARTED',
  Starting = 'STARTING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
}

export const appStatusIcons = new Map<AppStatus, string>([
  [AppStatus.Started, 'mdi-check-circle'],
  [AppStatus.Starting, 'mdi-progress-wrench'],
  [AppStatus.Deploying, 'mdi-progress-wrench'],
  [AppStatus.Stopping, 'mdi-progress-wrench'],
  [AppStatus.Stopped, 'mdi-stop-circle'],
]);

export const appStatusLabels = new Map<AppStatus, string>([
  [AppStatus.Started, T('Running')],
  [AppStatus.Starting, T('Starting')],
  [AppStatus.Deploying, T('Deploying')],
  [AppStatus.Stopped, T('Stopped')],
  [AppStatus.Stopping, T('Stopping')],
]);
