import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ChartReleaseStats, ChartStatisticsUpdate } from 'app/interfaces/chart-release.interface';
import { AppsStatisticsService } from 'app/pages/apps/store/apps-statistics.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AppsStatisticsService', () => {
  const plexStats = {};
  const minioStats = {};

  let spectator: SpectatorService<AppsStatisticsService>;
  const createService = createServiceFactory({
    service: AppsStatisticsService,
    providers: [
      mockProvider(WebSocketService, {
        subscribe: jest.fn(() => of({
          fields: [
            { id: 'plex', stats: plexStats },
            { id: 'minio', stats: minioStats },
          ],
        } as ApiEvent<ChartStatisticsUpdate[]>)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });
  describe('subscribeToUpdates()', () => {
    it('subscribes to chart statistics updates when subscribeToUpdates() is called', () => {
      spectator.service.subscribeToUpdates();
      expect(spectator.inject(WebSocketService).subscribe).toHaveBeenCalledWith('chart.release.statistics');
    });
  });

  describe('getStatsForApp()', () => {
    it('returns an observable with statistics for an app', () => {
      spectator.service.subscribeToUpdates();
      const plexStats$ = spectator.service.getStatsForApp('plex');

      let plexStatsUpdate: ChartReleaseStats;
      plexStats$.subscribe((stats) => plexStatsUpdate = stats);

      expect(plexStatsUpdate).toBe(plexStats);
    });
  });
});
