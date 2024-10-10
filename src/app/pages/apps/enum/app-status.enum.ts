import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppStatus {
  Running = 'RUNNING',
  Starting = 'STARTING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
  Crashed = 'CRASHED',
}

export const appStatusIcons = new Map<AppStatus, string>([
  [AppStatus.Running, 'mdi-check-circle'],
  [AppStatus.Starting, 'mdi-progress-wrench'],
  [AppStatus.Deploying, 'mdi-progress-wrench'],
  [AppStatus.Stopping, 'mdi-progress-wrench'],
  [AppStatus.Stopped, 'mdi-stop-circle'],
  [AppStatus.Crashed, 'mdi-stop-circle'],
]);

export const appStatusLabels = new Map<AppStatus, string>([
  [AppStatus.Running, T('Running')],
  [AppStatus.Starting, T('Starting')],
  [AppStatus.Deploying, T('Deploying')],
  [AppStatus.Stopped, T('Stopped')],
  [AppStatus.Stopping, T('Stopping')],
  [AppStatus.Crashed, T('Crashed')],
]);
