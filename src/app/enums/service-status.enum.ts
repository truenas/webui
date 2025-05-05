import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ServiceStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
}

export const serviceStatusLabels = new Map<ServiceStatus, string>([
  [ServiceStatus.Running, T('Running')],
  [ServiceStatus.Stopped, T('Stopped')],
]);
