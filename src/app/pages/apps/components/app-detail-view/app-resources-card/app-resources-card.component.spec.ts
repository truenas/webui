import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { EventUnion } from '@truenas/api-client';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

type RealtimeUpdate = Extract<EventUnion<WebUiApiDirectory, 'reporting.realtime'>, { msg: 'added' }>['fields'];

describe('AppResourcesCardComponent', () => {
  let spectator: Spectator<AppResourcesCardComponent>;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: AppResourcesCardComponent,
    imports: [
      FileSizePipe,
    ],
    providers: [
      mockApi([
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
    api = spectator.inject(ApiService);
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Available Resources');
  });

  it('shows information about available resources', () => {
    expect(api.subscribe).toHaveBeenCalledWith('reporting.realtime');

    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('CPU Usage:0% Avg. Usage');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Memory Usage: N/A');
    expect(spectator.queryAll('.app-list-item')[2]).toHaveText('Pool: pool');
  });

  it('loads and reports available space on apps dataset', async () => {
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('app.available_space');
    expect(spectator.queryAll('.app-list-item')[3]).toHaveText('Available Space: 2.44 KiB');
  });

  it('shows CPU and memory usage from realtime updates', () => {
    spectator.inject(MockApiService).emitEvent('reporting.realtime', {
      msg: 'added',
      fields: {
        cpu: { cpu: { usage: 12.34 } },
        memory: {
          arc_size: 1024,
          physical_memory_total: 8192,
          physical_memory_available: 4096,
        },
      } as unknown as RealtimeUpdate,
    });
    spectator.detectChanges();

    expect(spectator.queryAll('.app-list-item')[0]).toHaveText('CPU Usage:12% Avg. Usage');
    expect(spectator.queryAll('.app-list-item')[1]).toHaveText('Memory Usage: 4 KiB / 8 KiB');
  });
});
