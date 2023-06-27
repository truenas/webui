import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

describe('KubernetesStore', () => {
  let spectator: SpectatorService<KubernetesStore>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: KubernetesStore,
    providers: [
      mockProvider(ApplicationsService, {
        getKubernetesConfig: jest.fn(() => {
          return of({ pool: 'ix-applications-pool' } as KubernetesConfig);
        }) as () => Observable<KubernetesConfig>,
        getKubernetesServiceStarted: jest.fn(() => of(true)) as () => Observable<boolean>,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initialize();
    testScheduler = getTestScheduler();
  });

  it('emits the pool returned by middleware', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.selectedPool$).toBe('a', {
        a: 'ix-applications-pool',
      });
    });
  });

  it('emits the kubernetes status', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isKubernetesStarted$).toBe('a', {
        a: true,
      });
    });
  });
});
