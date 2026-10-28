import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse, EventUnion } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall, mockQuery } from 'app/core/testing/utils/mock-api.utils';
import { AppStats } from 'app/interfaces/app.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const pools = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as WebUiQueryEntity<'pool.query'>[];

const apps = [
  { id: '1', name: 'app_1' },
  { id: '2', name: 'app_2' },
] as WebUiQueryEntity<'app.query'>[];

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
  aggregations: { min: { received: 0 }, mean: { received: 5 }, max: { received: 10 } },
} as CallResponse<WebUiApiDirectory, 'reporting.netdata_get_data'>[number];

type RealtimeUpdate = Extract<EventUnion<WebUiApiDirectory, 'reporting.realtime'>, { msg: 'added' }>['fields'];

describe('WidgetResourcesService', () => {
  let spectator: SpectatorService<WidgetResourcesService>;
  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      mockApi([
        mockQuery('app.query', apps),
        mockQuery('pool.query', pools),
        mockQuery('replication.query', []),
        mockQuery('rsynctask.query', []),
        mockQuery('cloudsync.query', []),
        mockQuery('interface.query', []),
        mockCall('update.status', {
          status: {
            new_version: {},
          },
        } as CallResponse<WebUiApiDirectory, 'update.status'>),
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

  it('folds pool.query change events into pools', async () => {
    const emissions: unknown[] = [];
    spectator.service.pools$.subscribe((rows) => emissions.push(rows));
    await new Promise<void>((resolve) => {
      setTimeout(resolve);
    });

    spectator.inject(MockApiService).emitEvent('pool.query', {
      msg: 'changed',
      id: 2,
      fields: { ...pools[1], name: 'renamed' },
    });

    expect(emissions.at(-1)).toEqual([pools[0], { ...pools[1], name: 'renamed' }]);
  });

  it('returns apps', async () => {
    expect(await firstValueFrom(spectator.service.installedApps$)).toEqual(apps);
  });

  describe('updateAvailable$', () => {
    it('returns true when api knows about available updates', async () => {
      expect(await firstValueFrom(spectator.service.updateAvailable$)).toBe(true);
    });
  });

  describe('networkInterfaceLastHourStats', () => {
    it('returns network interface stats for the last hour', async () => {
      expect(
        await firstValueFrom(spectator.service.networkInterfaceLastHourStats('eth0')),
      ).toEqual([interfaceEth0]);
    });
  });

  describe('realtimeUpdates$', () => {
    it('emits reporting.realtime updates in the { fields } envelope', async () => {
      const update = { cpu: { cpu: { usage: 42, temp: 50 } } } as unknown as RealtimeUpdate;
      const received = firstValueFrom(spectator.service.realtimeUpdates$);

      spectator.inject(MockApiService).emitEvent('reporting.realtime', { msg: 'added', fields: update });

      expect(await received).toEqual({ fields: update });
      expect(spectator.inject(MockApiService).subscribe).toHaveBeenCalledWith('reporting.realtime');
    });
  });

  describe('getAppStats', () => {
    it('emits the stats of the requested app from app.stats', () => {
      const app1Stats = { app_name: 'app_1', cpu_usage: 10 } as AppStats;
      const app2Stats = { app_name: 'app_2', cpu_usage: 20 } as AppStats;
      const emissions: unknown[] = [];
      spectator.service.getAppStats('app_2').subscribe((state) => emissions.push(state));

      spectator.inject(MockApiService).emitEvent('app.stats', { msg: 'added', fields: [app1Stats, app2Stats] });

      expect(spectator.inject(MockApiService).subscribe).toHaveBeenCalledWith('app.stats');
      expect(emissions.at(-1)).toEqual({ isLoading: false, value: app2Stats });
    });
  });
});
