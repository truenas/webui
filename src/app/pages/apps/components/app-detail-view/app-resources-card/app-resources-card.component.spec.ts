import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/api.service';

describe('AppResourcesCardComponent', () => {
  let spectator: Spectator<AppResourcesCardComponent>;
  let websocket: WebSocketService;

  const createComponent = createComponentFactory({
    component: AppResourcesCardComponent,
    imports: [
      FileSizePipe,
    ],
    providers: [
      mockWebSocket([
        mockCall('app.available_space', 2500),
      ]),
      mockProvider(DockerStore, {
        selectedPool$: of('pool'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading: false,
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
  });

  it('loads and reports available space on apps dataset', () => {
    expect(websocket.call).toHaveBeenCalledWith('app.available_space');
    expect(spectator.queryAll('.app-list-item')[3]).toHaveText('Available Space: 2.44 KiB');
  });
});
