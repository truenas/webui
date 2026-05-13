import { computed, Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { groupBy, keyBy, sortBy } from 'lodash-es';
import {
  combineLatest, forkJoin, Observable, of, tap,
} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Alert } from 'app/interfaces/alert.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Zpool } from 'app/interfaces/zpool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';

export interface PoolsDashboardState {
  pools: Pool[];
  arePoolsLoading: boolean;

  isLoadingPoolDetails: boolean;
  scrubs: ScrubTask[];
  rootDatasets: Record<string, Dataset>;
  disks: StorageDashboardDisk[];
}

const initialState: PoolsDashboardState = {
  arePoolsLoading: false,
  isLoadingPoolDetails: false,
  pools: [],
  scrubs: [],
  rootDatasets: {},
  disks: [],
};

@Injectable()
export class PoolsDashboardStore extends ComponentStore<PoolsDashboardState> {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private poolStoreService = inject(poolStore);

  readonly pools = computed(() => this.state().pools);
  readonly arePoolsLoading = computed(() => this.state().arePoolsLoading);
  readonly isLoadingPoolDetails = computed(() => this.state().isLoadingPoolDetails);
  readonly disks = computed(() => this.state().disks);

  readonly rootDatasets$ = this.select((state) => state.rootDatasets);

  readonly disksByPool = computed<Record<string, StorageDashboardDisk[]>>(() => {
    return groupBy(this.state().disks, (disk) => disk.pool);
  });

  scrubForPool(pool: Pool): ScrubTask | undefined {
    return this.state().scrubs.find((scrub) => scrub.pool === pool.id);
  }

  constructor() {
    super(initialState);
  }

  readonly loadDashboard = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.poolStoreService.invalidate();
        this.patchState({
          ...initialState,
          arePoolsLoading: true,
          isLoadingPoolDetails: true,
        });
      }),
      switchMap(() => {
        return forkJoin([
          this.loadPoolsAndRootDatasets(),
          this.loadPoolDetails(),
        ]).pipe(
          catchError((error: unknown) => {
            this.patchState({
              arePoolsLoading: false,
              isLoadingPoolDetails: false,
            });
            this.errorHandler.showErrorModal(error);
            return of(null);
          }),
        );
      }),
    );
  });

  private loadPoolsAndRootDatasets(): Observable<[Pool[], Dataset[], Zpool[]]> {
    return combineLatest([
      this.api.callAndSubscribe('pool.query', [[], { extra: { is_upgraded: true } }]),
      this.api.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]),
      // TODO: `zpool.query` is not in the events-subscribable directory (see ApiEventDirectory),
      // so it cannot use callAndSubscribe. When `pool.query` re-emits via its live subscription,
      // combineLatest reuses this stale `zpool.query` value, meaning tier numbers
      // (class_normal_*, class_special_*) won't reflect the current state until the next
      // loadDashboard() call. Revisit once `zpool.query` events are supported.
      this.api.call('zpool.query', [{
        properties: [
          'class_normal_usable',
          'class_normal_used',
          'class_normal_available',
          'class_special_usable',
          'class_special_used',
          'class_special_available',
        ],
      }]),
    ]).pipe(
      tap(([pools, rootDatasets, zpools]) => {
        const zpoolsByName = keyBy(zpools, (zpool) => zpool.name);
        const poolsWithTierData = pools.map((pool) => {
          const zpool = zpoolsByName[pool.name];
          if (!zpool) return pool;
          const toBytes = (raw: number | string | undefined | null): number => Number(raw ?? 0);
          const specialUsable = zpool.properties.class_special_usable?.value;
          const specialReserved = specialUsable === undefined || specialUsable === null
            ? 0
            : Math.max(
                0,
                Number(specialUsable)
                - toBytes(zpool.properties.class_special_available?.value)
                - toBytes(zpool.properties.class_special_used?.value),
              );
          return {
            ...pool,
            used: toBytes(zpool.properties.class_normal_used?.value) || pool.used,
            available: toBytes(zpool.properties.class_normal_available?.value) || pool.available,
            special_class_used: toBytes(zpool.properties.class_special_used?.value),
            special_class_available: toBytes(zpool.properties.class_special_available?.value),
            special_class_reserved: specialReserved,
          };
        });
        this.patchState({
          arePoolsLoading: false,
          pools: sortBy(poolsWithTierData, (pool) => pool.name),
          rootDatasets: keyBy(rootDatasets, (dataset) => dataset.id),
        });
      }),
    );
  }

  private loadPoolDetails(): Observable<[StorageDashboardDisk[], ScrubTask[]]> {
    return forkJoin([
      this.loadDisks().pipe(
        switchMap(this.getDashboardDataForDisks.bind(this)),
        switchMap(this.processDisks.bind(this)),
      ),
      this.api.call('pool.scrub.query'),
    ]).pipe(
      tap(([disks, scrubs]) => {
        this.patchState({
          scrubs,
          disks: [...disks],
          isLoadingPoolDetails: false,
        });
      }),
    );
  }

  loadDisks(): Observable<Disk[]> {
    return this.api.call('disk.query', [[], { extra: { pools: true } }]);
  }

  private getDashboardDataForDisks(disks: StorageDashboardDisk[]): Observable<{
    disks: StorageDashboardDisk[];
    alerts: Alert[];
    tempAgg: DiskTemperatureAgg;
  }> {
    const disksNames = disks.map((disk) => disk.name);
    return combineLatest({
      disks: of(disks),
      alerts: this.api.call('disk.temperature_alerts', [disksNames]),
      tempAgg: this.api.call('disk.temperature_agg', [disksNames, 14]),
    });
  }

  private processDisks(
    {
      disks, alerts, tempAgg,
    }: {
      disks: StorageDashboardDisk[];
      alerts: Alert[];
      tempAgg: DiskTemperatureAgg;
    },
  ): Observable<StorageDashboardDisk[]> {
    const processedDisks = disks.map((disk) => ({
      ...disk,
      alerts: [] as Alert[],
      tempAggregates: disk.tempAggregates,
    }));

    for (const alert of alerts) {
      const alertArgs = (alert.args) as { device: string; message: string };
      const alertDevice = alertArgs.device.split('/').reverse()[0];
      const alertDisk = processedDisks.find((disk) => disk.name === alertDevice);
      alertDisk?.alerts?.push(alert);
    }

    const disksWithTempData = Object.keys(tempAgg);
    for (const diskWithTempData of disksWithTempData) {
      const dashboardDisk = processedDisks.find((disk) => disk.devname === diskWithTempData);
      if (dashboardDisk) {
        dashboardDisk.tempAggregates = { ...tempAgg[diskWithTempData] };
      }
    }
    return of(processedDisks);
  }
}
