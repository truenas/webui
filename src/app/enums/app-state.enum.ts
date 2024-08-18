import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',

  // TODO: Assumed that stopping status will be implemented https://ixsystems.atlassian.net/browse/NAS-130482
  Stopping = 'STOPPING',
}

export const appStateIcons = new Map<AppState, string>([
  [AppState.Running, 'mdi-check-circle'],
  [AppState.Deploying, 'mdi-progress-wrench'],
  [AppState.Stopping, 'mdi-progress-wrench'],
  [AppState.Stopped, 'mdi-stop-circle'],
]);

export const appStateLabels = new Map<AppState, string>([
  [AppState.Running, T('Running')],
  [AppState.Deploying, T('Deploying')],
  [AppState.Stopping, T('Stopping')],
  [AppState.Stopped, T('Stopped')],
]);
