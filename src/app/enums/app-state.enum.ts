import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { tnIconMarker } from '@truenas/ui-components';

export enum AppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
  Crashed = 'CRASHED',
}

export const appStateIcons = new Map<AppState, string>([
  [AppState.Running, tnIconMarker('check-circle', 'mdi')],
  [AppState.Deploying, tnIconMarker('progress-wrench', 'mdi')],
  [AppState.Stopped, tnIconMarker('stop-circle', 'mdi')],
  [AppState.Stopping, tnIconMarker('progress-wrench', 'mdi')],
  [AppState.Crashed, tnIconMarker('alert-circle', 'mdi')],
]);

export const appStateLabels = new Map<AppState, string>([
  [AppState.Running, T('Running')],
  [AppState.Deploying, T('Deploying')],
  [AppState.Stopped, T('Stopped')],
  [AppState.Stopping, T('Stopping')],
  [AppState.Crashed, T('Crashed')],
]);
