import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { ApiService } from 'app/modules/websocket/api.service';
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

describe('WidgetResourcesService', () => {
  let spectator: SpectatorService<WidgetResourcesService>;
  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      mockTypedApi([
        mockTypedQuery('app.query', apps),
        mockTypedQuery('pool.query', pools),
        mockTypedQuery('replication.query', []),
        mockTypedQuery('rsynctask.query', []),
        mockTypedQuery('cloudsync.query', []),
        mockTypedQuery('interface.query', []),
        mockTypedCall('update.status', {
          status: {
            new_version: {},
          },
        } as CallResponse<WebUiApiDirectory, 'update.status'>),
        mockTypedCall('reporting.netdata_get_data', [interfaceEth0]),
      ]),
      // `reporting.realtime` is still subscribed through the legacy client.
      mockProvider(ApiService),
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

    spectator.inject(MockTypedApiService).emitEvent('pool.query', {
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
});
