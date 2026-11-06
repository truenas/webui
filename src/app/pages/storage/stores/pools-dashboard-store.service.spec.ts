import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { Observable, of, Subject } from 'rxjs';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  let spectator: SpectatorService<PoolsDashboardStore>;
  const createService = createServiceFactory({
    service: PoolsDashboardStore,
    providers: [
      StorageService,
      mockProvider(ApiService, {
        // An instance property, so `mockProvider` cannot stub it on its own.
        query: jest.fn(),
      }),
      mockProvider(DialogService),
      mockProvider(ErrorHandlerService),
      mockProvider(poolStore, {
        invalidate: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  interface ApiAnswers {
    pools: Pool[] | Observable<Pool[]>;
    rootDatasets?: Dataset[];
    zpools?: unknown[];
    scrubs?: ScrubTask[];
    disks?: Disk[];
    temperatureAgg?: DiskTemperatureAgg;
  }

  /** Answers what `loadDashboard` reads; `pools` may be a subject to hold the pools half back. */
  function stubApi(answers: ApiAnswers): void {
    const api = spectator.inject(ApiService);
    const answer = (byMethod: Record<string, unknown>) => (method: string) => {
      if (!(method in byMethod)) {
        throw new Error(`Unexpected method: ${method}`);
      }
      const value = byMethod[method];
      return value instanceof Observable ? value : of(value);
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

  it('loads pools, root datasets, disks and scrubs and clears each loading indicator when its half arrives', () => {
    const pools$ = new Subject<Pool[]>();
    const scrubs = [
      { pool: 1 },
      { pool: 2 },
    ] as ScrubTask[];
    stubApi({
      pools: pools$,
      rootDatasets: [{ id: 'pool1' }, { id: 'pool2' }] as Dataset[],
      scrubs,
      disks,
      temperatureAgg,
    });

    spectator.service.loadDashboard();

    const store = spectator.service;
    expect(spectator.inject(poolStore).invalidate).toHaveBeenCalled();
    expect(store.arePoolsLoading()).toBe(true);
    expect(store.pools()).toEqual([]);
    expect(store.isLoadingPoolDetails()).toBe(false);
    expect(store.disks()).toEqual(dashboardDisks);
    expect(store.disksByPool()).toEqual({ lio: dashboardDisks });
    expect(store.scrubForPool({ id: 2 } as Pool)).toBe(scrubs[1]);

    pools$.next([
      { id: 2, name: 'pool2' },
      { id: 1, name: 'pool1' },
    ] as Pool[]);

    expect(store.arePoolsLoading()).toBe(false);
    expect(store.pools()).toEqual([
      { id: 1, name: 'pool1' },
      { id: 2, name: 'pool2' },
    ]);
    expect(store.rootDatasets()).toEqual({
      pool1: { id: 'pool1' },
      pool2: { id: 'pool2' },
    });
  });

  it('clears both loading indicators and shows the error when a call fails', () => {
    const pools$ = new Subject<Pool[]>();
    stubApi({ pools: pools$ });

    spectator.service.loadDashboard();
    pools$.error(new Error('Boom'));

    expect(spectator.service.arePoolsLoading()).toBe(false);
    expect(spectator.service.isLoadingPoolDetails()).toBe(false);
    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(new Error('Boom'));
  });

  it('leaves special_class_usable undefined when class_special_usable is absent', () => {
    stubApi({
      pools: [{ id: 1, name: 'pool1' }] as Pool[],
      zpools: [
        {
          name: 'pool1',
          properties: {
            class_special_available: { value: 100 },
            class_special_used: { value: 50 },
          },
        },
      ],
    });

    spectator.service.loadDashboard();

    expect(spectator.service.pools()).toEqual([
      expect.objectContaining({
        name: 'pool1',
        special_class_usable: undefined,
        special_class_used: 50,
        special_class_available: 100,
      }),
    ]);
  });

  it('keeps showing pools when zpool.query returns null properties', () => {
    stubApi({
      pools: [{
        id: 1, name: 'pool1', used: 10, available: 20,
      }] as Pool[],
      zpools: [{ name: 'pool1', properties: null }],
    });

    spectator.service.loadDashboard();

    expect(spectator.service.pools()).toEqual([
      {
        id: 1, name: 'pool1', used: 10, available: 20,
      },
    ]);
  });
});
