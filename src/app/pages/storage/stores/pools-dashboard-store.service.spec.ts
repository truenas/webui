import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService, StorageService, WebSocketService } from 'app/services';

const temperatureAgg = {
  sda: { min: 10, max: 30, avg: 20 },
  sdd: { min: 20, max: 50, avg: 40 },
} as DiskTemperatureAgg;

const disk: Disk = {
  advpowermgmt: DiskPowerLevel.Disabled,
  bus: DiskBus.Spi,
  critical: 0,
  description: '',
  devname: 'sdd',
  difference: 0,
  duplicate_serial: [],
  enclosure: {
    number: 0,
    slot: 0,
  },
  expiretime: '',
  hddstandby: DiskStandby.AlwaysOn,
  identifier: '{uuid}b3ba146f-1ab6-4a45-ae6b-37ea00baf0aa',
  informational: 0,
  model: 'VMware_Virtual_S',
  multipath_member: '',
  multipath_name: '',
  name: 'sdd',
  number: 2096,
  pool: 'lio',
  rotationrate: 0,
  serial: '',
  size: 5368709120,
  smartoptions: '',
  subsystem: 'scsi',
  togglesmart: true,
  transfermode: 'Auto',
  type: DiskType.Hdd,
  zfs_guid: '12387051346845729003',
};

const disks: Disk[] = [
  { ...disk },
];

const dashboardDisks: StorageDashboardDisk[] = [
  {
    ...disk,
    alerts: [],
    tempAggregates: { min: 20, max: 50, avg: 40 },
    smartTests: 0,
  },
];

describe('PoolsDashboardStore', () => {
  let spectator: SpectatorService<PoolsDashboardStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: PoolsDashboardStore,
    providers: [
      StorageService,
      mockProvider(WebSocketService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads pool topology and root datasets and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      const pools = [
        { name: 'pool1' },
        { name: 'pool2' },
      ] as Pool[];
      const rootDatasets = [
        { id: 'pool1' },
        { id: 'pool2' },
      ] as Dataset[];
      jest.spyOn(mockWebsocket, 'call').mockImplementation((method: string) => {
        if (method === 'pool.dataset.query') {
          return cold('-a|', { a: rootDatasets });
        } if (method === 'pool.query') {
          return cold('-a|', { a: pools });
        } if (method === 'disk.query') {
          return cold('-a|', { a: [...disks] });
        } if (method === 'disk.temperature_alerts') {
          return cold('-a|', { a: [] });
        } if (method === 'smart.test.results') {
          return cold('-a|', { a: [] });
        } if (method === 'disk.temperature_agg') {
          return cold('-a|', { a: { ...temperatureAgg } });
        }
      });

      spectator.service.loadDashboard();
      expectObservable(spectator.service.state$).toBe('abc', {
        a: {
          arePoolsLoading: true,
          areDisksLoading: true,
          pools: [],
          rootDatasets: {},
          disks: [],
        },
        b: {
          arePoolsLoading: false,
          areDisksLoading: true,
          pools: [
            { name: 'pool1' },
            { name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [],
        },
        c: {
          arePoolsLoading: false,
          areDisksLoading: false,
          pools: [
            { name: 'pool1' },
            { name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [...dashboardDisks],
        },
      });
    });
  });
});
