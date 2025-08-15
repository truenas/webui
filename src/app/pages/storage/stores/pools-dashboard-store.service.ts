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
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

  private loadPoolsAndRootDatasets(): Observable<[Pool[], Dataset[]]> {
    return combineLatest([
      this.api.callAndSubscribe('pool.query', [[], { extra: { is_upgraded: true } }]),
      this.api.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]),
    ]).pipe(
      tap(([pools, rootDatasets]) => {
        this.patchState({
          arePoolsLoading: false,
          pools: sortBy(pools, (pool) => pool.name),
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
