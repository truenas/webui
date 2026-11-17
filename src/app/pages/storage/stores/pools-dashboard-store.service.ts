import { computed, Injectable, inject } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { CallResponse } from '@truenas/api-client';
import { groupBy, keyBy, sortBy } from 'lodash-es';
import {
  catchError, combineLatest, EMPTY, forkJoin, map, Observable, of, pipe, switchMap, tap,
} from 'rxjs';
import { Alert, toAlert } from 'app/interfaces/alert.interface';
import { Dataset, toDataset } from 'app/interfaces/dataset.interface';
import {
  Disk, DiskTemperatureAgg, StorageDashboardDisk, toDisk,
} from 'app/interfaces/disk.interface';
import { ScrubTask, toScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool, toPool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
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
export class PoolsDashboardStore {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private poolStoreService = inject(poolStore);

  private readonly state = signalState(initialState);

  readonly pools = this.state.pools;
  readonly arePoolsLoading = this.state.arePoolsLoading;
  readonly isLoadingPoolDetails = this.state.isLoadingPoolDetails;
  readonly disks = this.state.disks;
  readonly rootDatasets = this.state.rootDatasets;

  readonly disksByPool = computed<Record<string, StorageDashboardDisk[]>>(() => {
    return groupBy(this.state.disks(), (disk) => disk.pool);
  });

  scrubForPool(pool: Pool): ScrubTask | undefined {
    return this.state.scrubs().find((scrub) => scrub.pool === pool.id);
  }

  readonly loadDashboard = rxMethod<void>(pipe(
    tap(() => {
      this.poolStoreService.invalidate();
      patchState(this.state, {
        ...initialState,
        arePoolsLoading: true,
        isLoadingPoolDetails: true,
      });
    }),
    // The pools half is a live subscription that never completes, so nothing reaches `next`:
    // both halves write the store themselves, and only an error needs handling here.
    switchMap(() => forkJoin([
      this.loadPoolsAndRootDatasets(),
      this.loadPoolDetails(),
    ]).pipe(
      catchError((error: unknown) => {
        patchState(this.state, {
          arePoolsLoading: false,
          isLoadingPoolDetails: false,
        });
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
    )),
  ));

  private loadPoolsAndRootDatasets(): Observable<[Pool[], Dataset[], CallResponse<WebUiApiDirectory, 'zpool.query'>]> {
    return combineLatest([
      this.api.queryAndSubscribe('pool.query', [], { extra: { is_upgraded: true } }).pipe(
        map((pools) => pools.map(toPool)),
      ),
      this.api.query('pool.dataset.query', [], { extra: { retrieve_children: false } }).pipe(
        map((datasets) => datasets.map(toDataset)),
      ),
      // TODO: `zpool.query` is not an event source in the generated event directory,
      // so it cannot use queryAndSubscribe. When `pool.query` re-emits via its live subscription,
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
          // `properties` is null when ZFS can't read them (unavailable pool),
          // in which case the pool is shown with the numbers pool.query gave us.
          const properties = zpoolsByName[pool.name]?.properties;
          if (!properties) return pool;
          // Middleware types a property's value as any scalar; the size classes read here are numbers.
          const toBytes = (raw: number | string | boolean | undefined | null): number => Number(raw ?? 0);
          // The metadata reserve is derived in the Usage card from
          // zfs.tier.config (special_class_metadata_reserve_pct), so the raw
          // ZFS values are passed through here untouched.
          const rawSpecialUsable = properties.class_special_usable?.value;
          return {
            ...pool,
            used: toBytes(properties.class_normal_used?.value) || pool.used,
            available: toBytes(properties.class_normal_available?.value) || pool.available,
            special_class_used: toBytes(properties.class_special_used?.value),
            special_class_available: toBytes(properties.class_special_available?.value),
            // Left undefined (not 0) when ZFS doesn't report it, so the Usage card
            // can tell "absent" from a genuine empty special vdev and fall back.
            special_class_usable: rawSpecialUsable == null ? undefined : Number(rawSpecialUsable),
          };
        });
        patchState(this.state, {
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
      this.api.query('pool.scrub.query').pipe(map((scrubs) => scrubs.map(toScrubTask))),
    ]).pipe(
      tap(([disks, scrubs]) => {
        patchState(this.state, {
          scrubs,
          disks: [...disks],
          isLoadingPoolDetails: false,
        });
      }),
    );
  }

  loadDisks(): Observable<Disk[]> {
    return this.api.query('disk.query', [], { extra: { pools: true } }).pipe(map((disks) => disks.map(toDisk)));
  }

  private getDashboardDataForDisks(disks: StorageDashboardDisk[]): Observable<{
    disks: StorageDashboardDisk[];
    alerts: Alert[];
    tempAgg: DiskTemperatureAgg;
  }> {
    const disksNames = disks.map((disk) => disk.name);
    return combineLatest({
      disks: of(disks),
      alerts: this.api.call('disk.temperature_alerts', [disksNames]).pipe(map((alerts) => alerts.map(toAlert))),
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
