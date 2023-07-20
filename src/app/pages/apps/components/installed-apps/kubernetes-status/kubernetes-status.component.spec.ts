import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { KubernetesStatusComponent } from 'app/pages/apps/components/installed-apps/kubernetes-status/kubernetes-status.component';
import { KubernetesStatus } from 'app/pages/apps/enum/kubernetes-status.enum';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

describe('KubernetesStatusComponent', () => {
  let spectator: Spectator<KubernetesStatusComponent>;

  const createHost = createHostFactory({
    component: KubernetesStatusComponent,
    imports: [CoreComponents],
  });

  function setupTest(status: KubernetesStatus): void {
    spectator = createHost('<ix-kubernetes-status></ix-kubernetes-status>', {
      providers: [
        mockProvider(KubernetesStore, {
          kubernetesStatus$: of(status),
        }),
      ],
    });
  }

  it('checks status for Running kubernetes status', () => {
    setupTest(KubernetesStatus.Running);
    expect(spectator.query('.status-wrapper span')).toHaveText('Cluster Running');
  });

  it('checks status for Initializing kubernetes status', () => {
    setupTest(KubernetesStatus.Initializing);
    expect(spectator.query('.status-wrapper span')).toHaveText('Initializing Cluster');
  });

  it('checks status for Error kubernetes status', () => {
    setupTest(KubernetesStatus.Error);
    expect(spectator.query('.status-wrapper span')).toHaveText('Error In Cluster');
  });

  it('hides kubernetes status when it is not set', () => {
    setupTest(null);
    expect(spectator.query('.status-wrapper span')).not.toExist();
  });
});
