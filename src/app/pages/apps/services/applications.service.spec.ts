import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse, EventUnion } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { customApp } from 'app/constants/catalog.constants';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import {
  mockTypedApi, mockTypedCall, mockTypedQuery, settleTypedApi,
} from 'app/core/testing/utils/mock-typed-api.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  AppQueryEvent, ApplicationsService, AppStartStopJobEvent,
} from 'app/pages/apps/services/applications.service';

describe('ApplicationsService', () => {
  let spectator: SpectatorService<ApplicationsService>;
  let filters: AppsFiltersValues;

  const appsRequestFilters = [
    ['recommended', '=', true],
    [
      'OR', [
        [['categories', 'rin', 'category1']],
        [['categories', 'rin', 'category2']],
      ],
    ],
  ];
  const appsRequestOptions = { order_by: ['-last_update'] };

  const appsResponse = [
    { name: 'app1' },
    { name: 'app2' },
    { name: customApp },
  ] as WebUiQueryEntity<'app.available'>[];

  const createService = createServiceFactory({
    service: ApplicationsService,
    providers: [
      mockTypedApi([
        mockTypedCall('app.upgrade_summary', {} as CallResponse<WebUiApiDirectory, 'app.upgrade_summary'>),
        mockTypedQuery('app.available', appsResponse),
        mockTypedQuery('app.latest', appsResponse),
        mockTypedQuery('pool.query', [{ name: 'pool1' }] as WebUiQueryEntity<'pool.query'>[]),
        mockTypedQuery('app.query', [{ name: 'minio' }] as WebUiQueryEntity<'app.query'>[]),
        mockTypedCall('catalog.get_app_details', {
          name: 'minio',
        } as CallResponse<WebUiApiDirectory, 'catalog.get_app_details'>),
        mockTypedCall('app.similar', [{ name: 'syncthing' }] as CallResponse<WebUiApiDirectory, 'app.similar'>),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    filters = {
      sort: AppsFiltersSort.LastUpdate,
      categories: ['category1', 'category2', AppExtraCategory.Recommended],
    };
  });

  describe('getAvailableApps', () => {
    it('loads available apps', async () => {
      const apps = await firstValueFrom(spectator.service.getAvailableApps(filters));
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith(
        'app.available',
        appsRequestFilters,
        appsRequestOptions,
      );
      expect(apps).toEqual(appsResponse.filter((app) => app.name !== customApp));
    });
  });

  describe('getAvailableApps without filters', () => {
    it('queries every available app when no filter is set', async () => {
      const apps = await firstValueFrom(spectator.service.getAvailableApps({ categories: [], sort: null }));
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('app.available');
      expect(apps).toEqual(appsResponse.filter((app) => app.name !== customApp));
    });
  });

  describe('getLatestApps', () => {
    it('loads latest apps', async () => {
      const apps = await firstValueFrom(spectator.service.getLatestApps(filters));
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith(
        'app.latest',
        appsRequestFilters,
        appsRequestOptions,
      );
      expect(apps).toEqual(appsResponse.filter((app) => app.name !== customApp));
    });
  });

  it('loads pools', async () => {
    expect(await firstValueFrom(spectator.service.getPoolList())).toEqual([{ name: 'pool1' }]);
    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('pool.query');
  });

  it('loads catalog app details for a train', async () => {
    expect(await firstValueFrom(spectator.service.getCatalogAppDetails('minio', 'stable'))).toEqual({ name: 'minio' });
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
      'catalog.get_app_details',
      ['minio', { train: 'stable' }],
    );
  });

  it('loads apps similar to an app', async () => {
    const apps = await firstValueFrom(
      spectator.service.getSimilarApps({ name: 'minio', train: 'stable' } as AvailableApp),
    );
    expect(apps).toEqual([{ name: 'syncthing' }]);
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('app.similar', ['minio', 'stable']);
  });

  it('loads installed apps with their config', async () => {
    expect(await firstValueFrom(spectator.service.getAllApps())).toEqual([{ name: 'minio' }]);
    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('app.query', [], {
      extra: { retrieve_config: true, host_ip: 'localhost' },
    });
  });

  it('loads one installed app with its schema', async () => {
    expect(await firstValueFrom(spectator.service.getApp('minio'))).toEqual([{ name: 'minio' }]);
    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('app.query', [['name', '=', 'minio']], {
      extra: { include_app_schema: true, retrieve_config: true, host_ip: 'localhost' },
    });
  });

  it('passes installed app changes and removals through', async () => {
    const events: AppQueryEvent[] = [];
    spectator.service.getInstalledAppsUpdates().subscribe((event) => events.push(event));
    await settleTypedApi();

    const mockedApi = spectator.inject(MockTypedApiService);
    mockedApi.emitEvent('app.query', {
      msg: 'changed', id: 'minio', fields: { name: 'minio' } as WebUiQueryEntity<'app.query'>,
    });
    mockedApi.emitEvent('app.query', { msg: 'removed', id: 'minio' });

    expect(events).toEqual([
      { msg: 'changed', id: 'minio', fields: { name: 'minio' } },
      { msg: 'removed', id: 'minio' },
    ]);
  });

  it('only passes on start and stop jobs', async () => {
    const events: AppStartStopJobEvent[] = [];
    spectator.service.getInstalledAppsStatusUpdates().subscribe((event) => events.push(event));
    await settleTypedApi();

    const mockedApi = spectator.inject(MockTypedApiService);
    const job = (id: number, method: string): EventUnion<WebUiApiDirectory, 'core.get_jobs'> => ({
      msg: 'changed', id, fields: { id, method },
    } as EventUnion<WebUiApiDirectory, 'core.get_jobs'>);
    mockedApi.emitEvent('core.get_jobs', job(1, 'app.start'));
    mockedApi.emitEvent('core.get_jobs', job(2, 'pool.scrub'));
    mockedApi.emitEvent('core.get_jobs', job(3, 'app.stop'));
    mockedApi.emitEvent('core.get_jobs', { msg: 'removed', id: 4 });

    expect(events.map((event) => event.fields.method)).toEqual(['app.start', 'app.stop']);
  });

  describe('getAppUpgradeSummary', () => {
    it('loads summary without version', async () => {
      await firstValueFrom(spectator.service.getAppUpgradeSummary('test'));
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('app.upgrade_summary', ['test']);
    });
    it('loads summary with version', async () => {
      await firstValueFrom(spectator.service.getAppUpgradeSummary('test', '2.0'));
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('app.upgrade_summary', [
        'test', { app_version: '2.0' },
      ]);
    });
  });

  describe('convertDateToRelativeDate', () => {
    // Scoped here: the typed double answers on a microtask, which fake timers would hold.
    beforeEach(() => {
      jest.useFakeTimers({
        now: new Date(2023, 2, 24, 2, 0), // 2023-03-24 02:00:00
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('converts 1 day old date', () => {
      const date = new Date(2023, 2, 23, 12); // 2023-03-23 12:00:00
      expect(spectator.service.convertDateToRelativeDate(date)).toBe('Last 24 hours');
    });

    it('converts 3 day old date', () => {
      const date = new Date(2023, 2, 21, 12); // 2023-03-21 12:00:00
      expect(spectator.service.convertDateToRelativeDate(date)).toBe('Last 3 days');
    });

    it('converts week old date', () => {
      const date = new Date(2023, 2, 18); // 2023-03-18 00:00:00
      expect(spectator.service.convertDateToRelativeDate(date)).toBe('Last week');
    });

    it('converts month old date', () => {
      const date = new Date(2023, 2, 1); // 2023-03-01 00:00:00
      expect(spectator.service.convertDateToRelativeDate(date)).toBe('Last month');
    });

    it('converts year old date', () => {
      const date = new Date(2022, 2, 24); // 2022-03-24 00:00:00
      expect(spectator.service.convertDateToRelativeDate(date)).toBe('Long time ago');
    });
  });
});
