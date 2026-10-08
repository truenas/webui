import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { StorageService } from 'app/services/storage.service';

const temperatureAgg = {
  sda: { min: 10, max: 30, avg: 20 },
  sdd: { min: 20, max: 50, avg: 40 },
} as DiskTemperatureAgg;

const disk: Disk = {
  advpowermgmt: DiskPowerLevel.Disabled,
  bus: DiskBus.Spi,
  description: '',
  devname: 'sdd',
  expiretime: '',
  hddstandby: DiskStandby.AlwaysOn,
  identifier: '{uuid}b3ba146f-1ab6-4a45-ae6b-37ea00baf0aa',
  model: 'VMware_Virtual_S',
  name: 'sdd',
  number: 2096,
  pool: 'lio',
  rotationrate: 0,
  serial: '',
  size: 5368709120,
  subsystem: 'scsi',
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
  },
];

describe('PoolsDashboardStore', () => {
  const websocketSubscription$ = new Subject<ApiEvent<Pool>>();
  let spectator: SpectatorService<PoolsDashboardStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: PoolsDashboardStore,
    providers: [
      StorageService,
      mockProvider(TypedApiService, {
        subscribe: jest.fn(() => websocketSubscription$),
        // An instance property, so `mockProvider` cannot stub it on its own.
        query: jest.fn(),
      }),
      mockProvider(DialogService),
      mockProvider(poolStore, {
        invalidate: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  interface ApiAnswers {
    pools: Pool[];
    rootDatasets?: Dataset[];
    zpools?: unknown[];
    scrubs?: ScrubTask[];
    disks?: Disk[];
    temperatureAgg?: DiskTemperatureAgg;
  }

  /** Answers what `loadDashboard` reads, each on the next frame. */
  function stubApi(cold: RunHelpers['cold'], answers: ApiAnswers): void {
    const api = spectator.inject(TypedApiService);
    const answer = (byMethod: Record<string, unknown>) => (method: string) => {
      if (!(method in byMethod)) {
        throw new Error(`Unexpected method: ${method}`);
      }
      return cold('-a|', { a: byMethod[method] });
    };

    jest.mocked(api.queryAndSubscribe).mockImplementation(answer({ 'pool.query': answers.pools }) as never);
    (api.query as unknown as jest.Mock).mockImplementation(answer({
      'pool.dataset.query': answers.rootDatasets ?? [],
      'pool.scrub.query': answers.scrubs ?? [],
      'disk.query': answers.disks ?? [],
    }));
    jest.mocked(api.call).mockImplementation(answer({
      'zpool.query': answers.zpools ?? [],
      'disk.temperature_alerts': [],
      'disk.temperature_agg': answers.temperatureAgg ?? {},
    }) as never);
  }

  it('loads pool topology and root datasets and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const pools = [
        { id: 1, name: 'pool1' },
        { id: 2, name: 'pool2' },
      ] as Pool[];
      const rootDatasets = [
        { id: 'pool1' },
        { id: 'pool2' },
      ] as Dataset[];
      const scrubs = [
        { pool: 1 },
        { pool: 2 },
      ] as ScrubTask[];
      stubApi(cold, {
        pools, rootDatasets, scrubs, disks, temperatureAgg,
      });

      spectator.service.loadDashboard();

      expectObservable(spectator.service.state$).toBe('ab-c', {
        a: {
          arePoolsLoading: true,
          isLoadingPoolDetails: true,
          pools: [],
          rootDatasets: {},
          disks: [],
          scrubs: [],
        },
        b: {
          arePoolsLoading: false,
          isLoadingPoolDetails: true,
          pools: [
            { id: 1, name: 'pool1' },
            { id: 2, name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [],
          scrubs: [],
        },
        c: {
          arePoolsLoading: false,
          isLoadingPoolDetails: false,
          pools: [
            { id: 1, name: 'pool1' },
            { id: 2, name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [...dashboardDisks],
          scrubs,
        },
      });
    });
  });

  it('leaves special_class_usable undefined when class_special_usable is absent', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const pools = [
        { id: 1, name: 'pool1' },
      ] as Pool[];
      const zpools = [
        {
          name: 'pool1',
          properties: {
            class_special_available: { value: 100 },
            class_special_used: { value: 50 },
          },
        },
      ];

      stubApi(cold, { pools, zpools });

      spectator.service.loadDashboard();

      expectObservable(
        spectator.service.select((state) => state.pools),
      ).toBe('ab', {
        a: [],
        b: [
          expect.objectContaining({
            name: 'pool1',
            special_class_usable: undefined,
            special_class_used: 50,
            special_class_available: 100,
          }),
        ],
      });
    });
  });

  it('keeps showing pools when zpool.query returns null properties', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const pools = [
        {
          id: 1, name: 'pool1', used: 10, available: 20,
        },
      ] as Pool[];
      const zpools = [
        { name: 'pool1', properties: null },
      ];

      stubApi(cold, { pools, zpools });

      spectator.service.loadDashboard();

      expectObservable(
        spectator.service.select((state) => state.pools),
      ).toBe('ab', {
        a: [],
        b: [
          {
            id: 1, name: 'pool1', used: 10, available: 20,
          },
        ],
      });
    });
  });
});
