import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

export enum AppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
  Crashed = 'CRASHED',
}

export const appStateIcons = new Map<AppState, string>([
  [AppState.Running, iconMarker('mdi-check-circle')],
  [AppState.Deploying, iconMarker('mdi-progress-wrench')],
  [AppState.Stopped, iconMarker('mdi-stop-circle')],
  [AppState.Stopping, iconMarker('mdi-progress-wrench')],
  [AppState.Crashed, iconMarker('mdi-alert-circle')],
]);

export const appStateLabels = new Map<AppState, string>([
  [AppState.Running, T('Running')],
  [AppState.Deploying, T('Deploying')],
  [AppState.Stopped, T('Stopped')],
  [AppState.Stopping, T('Stopping')],
  [AppState.Crashed, T('Crashed')],
]);
