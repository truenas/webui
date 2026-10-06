import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { customApp } from 'app/constants/catalog.constants';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

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
