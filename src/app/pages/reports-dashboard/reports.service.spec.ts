import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Disk } from 'app/interfaces/disk.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';

describe('ReportsService', () => {
  let spectator: SpectatorService<ReportsService>;
  let api: MockApiService;

  const createService = createServiceFactory({
    service: ReportsService,
    providers: [
      mockApi([
        mockCall('disk.query', [
          { devname: 'sda', identifier: '{uuid}test-sda-uuid' },
          { devname: 'sdb', identifier: '{uuid}test-sdb-uuid' },
        ] as Disk[]),
        mockCall('reporting.netdata_graphs', []),
        mockCall('disk.temperatures', {}),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockApiService);
  });

  describe('getDiskDevices', () => {
    it('returns disk options', async () => {
      const options = await firstValueFrom(spectator.service.getDiskDevices());
      expect(api.call).toHaveBeenCalledWith('disk.query');
      expect(options).toEqual([
        { label: 'sda', value: '{uuid}test-sda-uuid' },
        { label: 'sdb', value: '{uuid}test-sdb-uuid' },
      ]);
    });
  });
});
