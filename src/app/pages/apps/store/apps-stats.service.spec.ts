import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { AppStats } from 'app/interfaces/app.interface';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';

describe('AppsStatsService', () => {
  const plexStats: AppStats = {
    app_name: 'plex',
    cpu_usage: 10,
    memory: 20,
    networks: [{
      interface_name: 'eth0',
      rx_bytes: 1024,
      tx_bytes: 512,
    }],
    blkio: {
      read: 2048,
      write: 4096,
    },
  };
  const minioStats: AppStats = {
    app_name: 'minio',
    cpu_usage: 90,
    memory: 80,
    networks: [{
      interface_name: 'eth0',
      rx_bytes: 256,
      tx_bytes: 512,
    }],
    blkio: {
      read: 1024,
      write: 2048,
    },
  };

  let spectator: SpectatorService<AppsStatsService>;
  const createService = createServiceFactory({
    service: AppsStatsService,
    providers: [
      mockTypedApi(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('subscribeToUpdates()', () => {
    it('subscribes to app stats updates when subscribeToUpdates() is called', () => {
      spectator.service.subscribeToUpdates();
      expect(spectator.inject(MockTypedApiService).subscribe).toHaveBeenCalledWith('app.stats');
    });
  });

  describe('getStatsForApp()', () => {
    it('returns an observable with stats for an app', () => {
      spectator.service.subscribeToUpdates();
      spectator.inject(MockTypedApiService).emitEvent('app.stats', { msg: 'added', fields: [plexStats, minioStats] });
      const plexStats$ = spectator.service.getStatsForApp('plex');

      let plexStatsUpdate: AppStats | undefined = undefined;
      plexStats$.subscribe((stats) => plexStatsUpdate = stats);

      expect(plexStatsUpdate).toEqual(plexStats);
    });
  });
});
