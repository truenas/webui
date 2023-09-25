import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum KubernetesStatus {
  Running = 'RUNNING',
  Initializing = 'INITIALIZING',
  Stopped = 'STOPPED',
  Stopping = 'STOPPING',
  Pending = 'PENDING',
  Unconfigured = 'UNCONFIGURED',
  Failed = 'FAILED',
}

export const kubernetesStatusLabels = new Map<KubernetesStatus, string>([
  [KubernetesStatus.Running, T('Apps Service Running')],
  [KubernetesStatus.Initializing, T('Initializing Apps Service')],
  [KubernetesStatus.Failed, T('Error In Apps Service')],
  [KubernetesStatus.Stopped, T('Apps Service Stopped')],
  [KubernetesStatus.Stopping, T('Stopping Apps Service')],
  [KubernetesStatus.Pending, T('Apps Service Pending')],
  [KubernetesStatus.Unconfigured, T('Apps Service Not Configured')],
]);
