import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AppResourcesCardComponent', () => {
  let spectator: Spectator<AppResourcesCardComponent>;
  let websocket: WebSocketService;

  const isLoading$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: AppResourcesCardComponent,
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.get_instance', {
          available: {
            rawvalue: '2500',
          },
        } as DatasetDetails),
      ]),
      mockProvider(KubernetesStore, {
        selectedPool$: of('pool'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading$,
      },
    });
    websocket = spectator.inject(WebSocketService);
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Available Resources');
  });

  it('shows information about available resources', () => {
    expect(websocket.subscribe).toHaveBeenCalledWith('reporting.realtime');

    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('CPU Usage:0% Avg. Usage');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Memory Usage: N/A');
    expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Pool: pool');
    expect(spectator.queryAll('.app-list-item')[3]).toHaveText('Available Space: 2.44 KiB');
  });
});
