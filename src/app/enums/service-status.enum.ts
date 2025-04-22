import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ServiceStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Loading = 'LOADING', // extra state for UI
}

export const serviceStatusLabels = new Map<ServiceStatus, string>([
  [ServiceStatus.Running, T('Running')],
  [ServiceStatus.Stopped, T('Stopped')],
  [ServiceStatus.Loading, T('Loading')],
]);
