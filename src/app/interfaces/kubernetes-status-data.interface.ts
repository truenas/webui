import { KubernetesStatus } from 'app/pages/apps/enum/kubernetes-status.enum';

export interface KubernetesStatusData {
  status: KubernetesStatus;
  description: string;
}
