import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockGlobalStore } from 'app/core/testing/classes/mock-global-store.service';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { App } from 'app/interfaces/app.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { poolStore } from 'app/services/global-store/stores.constant';

const pools = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const apps = [
  { id: '1', name: 'app_1' },
  { id: '2', name: 'app_2' },
] as App[];

describe('WidgetResourcesService', () => {
  let spectator: SpectatorService<WidgetResourcesService>;
  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      mockWebSocket([
        mockCall('app.query', apps),
        mockCall('replication.query'),
        mockCall('rsynctask.query'),
        mockCall('cloudsync.query'),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('interface.query'),
        mockCall('update.check_available'),
      ]),
      mockGlobalStore([
        [poolStore, { callAndSubscribe: pools }],
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('returns pools', async () => {
    expect(await firstValueFrom(spectator.service.pools$)).toEqual(pools);
  });

  it('returns apps', async () => {
    expect(await firstValueFrom(spectator.service.installedApps$)).toEqual(apps);
  });
});
