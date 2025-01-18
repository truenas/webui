import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { App } from 'app/interfaces/app.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';

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
      mockApi([
        mockCall('app.query', apps),
        mockCall('pool.query', pools),
        mockCall('replication.query'),
        mockCall('rsynctask.query'),
        mockCall('cloudsync.query'),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('interface.query'),
        mockCall('update.check_available'),
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
