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
  [KubernetesStatus.Running, T('Cluster Running')],
  [KubernetesStatus.Initializing, T('Initializing Cluster')],
  [KubernetesStatus.Failed, T('Error In Cluster')],
  [KubernetesStatus.Stopped, T('Cluster Stopped')],
  [KubernetesStatus.Stopping, T('Stopping Cluster')],
  [KubernetesStatus.Pending, T('Cluster Pending')],
  [KubernetesStatus.Unconfigured, T('Cluster Not Configured')],
]);
