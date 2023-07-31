import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ApplicationsService', () => {
  let spectator: SpectatorService<ApplicationsService>;
  let filters: AppsFiltersValues;

  const appsRequestPayload = [
    [
      ['catalog', 'in', ['catalog1', 'catalog2']],
      ['recommended', '=', true],
      [
        'OR', [
          ['categories', 'rin', 'category1'],
          ['categories', 'rin', 'category2'],
        ],
      ],
    ],
    { order_by: ['-last_update'] },
  ];

  const appsResponse = [
    { name: 'app1' },
    { name: 'app2' },
    { name: ixChartApp },
  ] as AvailableApp[];

  const createService = createServiceFactory({
    service: ApplicationsService,
    providers: [
      mockWebsocket([
        mockCall('chart.release.upgrade_summary'),
        mockCall('app.available', appsResponse),
        mockCall('app.latest', appsResponse),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.useFakeTimers({
      now: new Date(2023, 2, 24, 2, 0), // 2023-03-24 02:00:00
    });

    filters = {
      catalogs: ['catalog1', 'catalog2'],
      sort: AppsFiltersSort.LastUpdate,
      categories: ['category1', 'category2', AppExtraCategory.Recommended],
    };
  });

  describe('getAvailableApps', () => {
    it('loads available apps', async () => {
      const apps = await firstValueFrom(spectator.service.getAvailableApps(filters));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('app.available', appsRequestPayload);
      expect(apps).toEqual(appsResponse.filter((app) => app.name !== ixChartApp));
    });
  });

  describe('getLatestApps', () => {
    it('loads latest apps', async () => {
      const apps = await firstValueFrom(spectator.service.getLatestApps(filters));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('app.latest', appsRequestPayload);
      expect(apps).toEqual(appsResponse.filter((app) => app.name !== ixChartApp));
    });
  });

  describe('getChartUpgradeSummary', () => {
    it('loads summary without version', async () => {
      await firstValueFrom(spectator.service.getChartUpgradeSummary('test'));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('chart.release.upgrade_summary', ['test']);
    });
    it('loads summary with version', async () => {
      await firstValueFrom(spectator.service.getChartUpgradeSummary('test', '2.0'));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('chart.release.upgrade_summary', [
        'test', { item_version: '2.0' },
      ]);
    });
  });

  describe('convertDateToRelativeDate', () => {
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
