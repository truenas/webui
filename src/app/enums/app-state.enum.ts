import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Crashed = 'CRASHED',
}

export const appStateIcons = new Map<AppState, string>([
  [AppState.Running, 'mdi-check-circle'],
  [AppState.Deploying, 'mdi-progress-wrench'],
  [AppState.Stopped, 'mdi-stop-circle'],
  [AppState.Crashed, 'mdi-alert-circle'],
]);

export const appStateLabels = new Map<AppState, string>([
  [AppState.Running, T('Running')],
  [AppState.Deploying, T('Deploying')],
  [AppState.Stopped, T('Stopped')],
  [AppState.Crashed, T('Crashed')],
]);
