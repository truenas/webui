import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum DockerStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Initializing = 'INITIALIZING',
  Stopping = 'STOPPING',
  Stopped = 'STOPPED',
  Unconfigured = 'UNCONFIGURED',
  Failed = 'FAILED',
}

export const dockerStatusLabels = new Map<DockerStatus, string>([
  [DockerStatus.Running, T('Apps Service Running')],
  [DockerStatus.Initializing, T('Initializing Apps Service')],
  [DockerStatus.Failed, T('Error In Apps Service')],
  [DockerStatus.Stopped, T('Apps Service Stopped')],
  [DockerStatus.Stopping, T('Stopping Apps Service')],
  [DockerStatus.Pending, T('Apps Service Pending')],
  [DockerStatus.Unconfigured, T('Apps Service Not Configured')],
]);
