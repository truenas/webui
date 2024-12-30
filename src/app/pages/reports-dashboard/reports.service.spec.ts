import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
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
        mockCall('reporting.netdata_graphs', [
          { name: ReportingGraphName.Cpu },
          { name: ReportingGraphName.Ups },
        ] as ReportingGraph[]),
        mockCall('reporting.netdata_get_data', [{
          name: 'cpu',
          identifier: 'cpu',
          legend: ['time', 'active'],
          start: 1735281261,
          end: 1735281265,
          data: [
            [1735281261, 382],
            [1735281262, 381],
            [1735281263, 380],
            [1735281264, 384],
          ],
          aggregations: { min: [0], mean: [5], max: [10] },
        }]),
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

  describe('getNetData', () => {
    it('returns report data', async () => {
      const data = await firstValueFrom(spectator.service.getNetData({
        params: { name: 'cpu' },
        truncate: true,
        timeFrame: { start: 1735284410000, end: 1735284411000 },
        report: { vertical_label: '%' } as Report,
      }));
      expect(api.call).toHaveBeenCalledWith(
        'reporting.netdata_get_data',
        [[{ name: 'cpu' }], { end: 1735284411000, start: 1735284410000 }],
      );
      expect(data).toEqual({
        name: 'cpu',
        identifier: 'cpu',
        legend: ['active'],
        start: 1735281261,
        end: 1735281265,
        aggregations: { max: ['10'], mean: ['5'], min: ['0'] },
        data: [[1735281261, 382], [1735281262, 381], [1735281263, 380], [1735281264, 384]],
      });
    });
  });

  describe('getReportTabs', () => {
    it('returns report tabs', () => {
      const tabs = spectator.service.getReportTabs();
      expect(tabs).toEqual([
        { label: 'CPU', value: ReportType.Cpu },
        { label: 'Disk', value: ReportType.Disk },
        { label: 'Memory', value: ReportType.Memory },
        { label: 'Network', value: ReportType.Network },
        { label: 'NFS', value: ReportType.Nfs },
        { label: 'Partition', value: ReportType.Partition },
        { label: 'System', value: ReportType.System },
        { label: 'UPS', value: ReportType.Ups },
        { label: 'Target', value: ReportType.Target },
        { label: 'ZFS', value: ReportType.Zfs },
      ]);
    });
  });

  describe('getDiskMetrics', () => {
    it('returns disk metrics', async () => {
      const fakeMetrics = [
        { label: 'sda', value: 'uuid_sda' },
        { label: 'sdb', value: 'uuid_sdb' },
      ];
      spectator.service.setDiskMetrics(fakeMetrics);

      const metrics = await firstValueFrom(spectator.service.getDiskMetrics());
      expect(metrics).toEqual(fakeMetrics);
    });
  });
});
