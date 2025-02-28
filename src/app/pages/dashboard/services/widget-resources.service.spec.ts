import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { App } from 'app/interfaces/app.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { systemInfoLoaded, systemInfoUpdated } from 'app/store/system-info/system-info.actions';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const pools = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const apps = [
  { id: '1', name: 'app_1' },
  { id: '2', name: 'app_2' },
] as App[];

const interfaceEth0 = {
  name: 'interface',
  identifier: 'eth0',
  legend: ['time', 'received', 'sent'],
  start: 1735281261,
  end: 1735281265,
  data: [
    [1740117920, 2.2, 0.5],
    [1740117921, 2.3, 1.2],
    [1740117922, 2.4, 1.1],
  ],
  aggregations: { min: [0], mean: [5], max: [10] },
};

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
        mockCall('reporting.netdata_get_data', [interfaceEth0]),
      ]),
      mockProvider(Store, {
        dispatch: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              datetime: { $date: 1740117922320 },
            } as SystemInfo,
          },
        ],
      }),
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

  describe('networkInterfaceLastHourStats', () => {
    it('returns network interface stats for the last hour', async () => {
      expect(
        await firstValueFrom(spectator.service.networkInterfaceLastHourStats('eth0')),
      ).toEqual([interfaceEth0]);
    });

    it('resets and updates system info', async () => {
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
      await firstValueFrom(spectator.service.networkInterfaceLastHourStats('eth0'));

      expect(store$.dispatch).toHaveBeenCalledWith(
        systemInfoLoaded({ systemInfo: null }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        systemInfoUpdated(),
      );
    });
  });
});
