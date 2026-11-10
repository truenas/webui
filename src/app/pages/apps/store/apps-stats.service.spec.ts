import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
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
      mockApi(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('subscribeToUpdates()', () => {
    it('subscribes to app stats updates when subscribeToUpdates() is called', () => {
      spectator.service.subscribeToUpdates();
      expect(spectator.inject(MockApiService).subscribe).toHaveBeenCalledWith('app.stats');
    });
  });

  describe('getStatsForApp()', () => {
    it('returns the latest stats for an app', () => {
      expect(spectator.service.getStatsForApp('plex')).toBeUndefined();

      spectator.service.subscribeToUpdates();
      spectator.inject(MockApiService).emitEvent('app.stats', { msg: 'added', fields: [plexStats, minioStats] });

      expect(spectator.service.getStatsForApp('plex')).toEqual(plexStats);
      expect(spectator.service.getStatsForApp('minio')).toEqual(minioStats);
    });
  });
});
