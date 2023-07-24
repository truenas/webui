import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KubernetesStatus, kubernetesStatusLabels } from 'app/pages/apps/enum/kubernetes-status.enum';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

@Component({
  selector: 'ix-kubernetes-status',
  templateUrl: './kubernetes-status.component.html',
  styleUrls: ['./kubernetes-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KubernetesStatusComponent {
  readonly kubernetesStatus = KubernetesStatus;
  readonly kubernetesStatusLabels = kubernetesStatusLabels;

  status$ = this.store.kubernetesStatus$;
  statusDescription$ = this.store.kubernetesStatusDescription$;

  constructor(private store: KubernetesStore) {}
}
