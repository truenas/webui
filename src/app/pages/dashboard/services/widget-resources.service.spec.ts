import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { mockGlobalStore } from 'app/core/testing/classes/mock-global-store.service';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { App } from 'app/interfaces/app.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { appStore, poolStore } from 'app/services/global-store/stores.constant';

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
        mockCall('replication.query'),
        mockCall('rsynctask.query'),
        mockCall('cloudsync.query'),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('interface.query'),
        mockCall('update.check_available'),
      ]),
      mockGlobalStore([
        [poolStore, { callAndSubscribe: pools }],
        [appStore, { call: apps }],
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('returns pools', () => {
    let poolsResponse: Pool[];
    spectator.service.pools$.subscribe((response) => poolsResponse = response);
    expect(poolsResponse).toEqual(pools);
  });

  it('returns apps', () => {
    let appsResponse: App[];
    spectator.service.installedApps$.subscribe((response) => appsResponse = response.value);
    expect(appsResponse).toEqual(apps);
  });
});
