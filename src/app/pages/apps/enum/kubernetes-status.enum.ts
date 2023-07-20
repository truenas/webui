import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum KubernetesStatus {
  Running = 'RUNNING',
  Initializing = 'INITIALIZING',
  Error = 'ERROR',
  Stopped = 'STOPPED',
}

export const kubernetesStatusLabels = new Map<KubernetesStatus, string>([
  [KubernetesStatus.Running, T('Cluster Running')],
  [KubernetesStatus.Initializing, T('Initializing Cluster')],
  [KubernetesStatus.Error, T('Error In Cluster')],
  [KubernetesStatus.Stopped, T('Cluster Stopped')],
]);
