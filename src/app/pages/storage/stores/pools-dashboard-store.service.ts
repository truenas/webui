import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import {
  combineLatest, forkJoin, Observable, of, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface PoolsDashboardState {
  arePoolsLoading: boolean;
  areDisksLoading: boolean;
  pools: Pool[];
  rootDatasets: { [id: string]: Dataset };
  disks: StorageDashboardDisk[];
}

const initialState: PoolsDashboardState = {
  arePoolsLoading: false,
  areDisksLoading: false,
  pools: [],
  rootDatasets: {},
  disks: [],
};

interface DashboardPools {
  pools: Pool[];
  rootDatasets: Dataset[];
}

@Injectable()
export class PoolsDashboardStore extends ComponentStore<PoolsDashboardState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly arePoolsLoading$ = this.select((state) => state.arePoolsLoading);
  readonly areDisksLoading$ = this.select((state) => state.areDisksLoading);
  readonly disks$ = this.select((state) => state.disks);
  readonly rootDatasets$ = this.select((state) => state.rootDatasets);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private sorter: StorageService,
  ) {
    super(initialState);
  }

  readonly loadDashboard = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          arePoolsLoading: true,
          areDisksLoading: true,
        });
      }),
      switchMap(() => this.updatePoolsAndDisksState()),
    );
  });

  updatePoolsAndDisksState(): Observable<{
    dashboardPools: DashboardPools;
    dashboardDisks: StorageDashboardDisk[];
  }> {
    return forkJoin({
      dashboardPools: this.getPoolsAndRootDatasets().pipe(
        this.patchStateWithPoolData(),
      ),
      dashboardDisks: this.getDisksWithDashboardData().pipe(
        this.patchStateWithDisksData(),
      ),
    });
  }

  getPoolsAndRootDatasets(): Observable<DashboardPools> {
    return combineLatest({
      pools: this.getPools(),
      rootDatasets: this.getRootDatasets(),
    });
  }

  patchStateWithPoolData(): (source: Observable<DashboardPools>) => Observable<DashboardPools> {
    return tapResponse<DashboardPools>(
      ({ pools, rootDatasets }) => {
        this.patchState({
          arePoolsLoading: false,
          pools: this.sorter.tableSorter(pools, 'name', 'asc'),
          rootDatasets: _.keyBy(rootDatasets, (dataset) => dataset.id),
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          arePoolsLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  getPools(): Observable<Pool[]> {
    return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  getRootDatasets(): Observable<Dataset[]> {
    return this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]);
  }

  getDisksWithDashboardData(): Observable<StorageDashboardDisk[]> {
    return this.getDisks().pipe(
      switchMap(this.getDashboardDataForDisks.bind(this)),
      switchMap(this.getProcessedDisks.bind(this)),
    );
  }

  patchStateWithDisksData(): (source: Observable<StorageDashboardDisk[]>) => Observable<StorageDashboardDisk[]> {
    return tapResponse<StorageDashboardDisk[]>(
      (disks: StorageDashboardDisk[]) => {
        this.patchState({
          disks: [...disks],
          areDisksLoading: false,
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          areDisksLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  getDisks(): Observable<Disk[]> {
    return this.ws.call('disk.query', [[], { extra: { pools: true } }]);
  }

  getDashboardDataForDisks(disks: StorageDashboardDisk[]): Observable<{
    disks: StorageDashboardDisk[];
    alerts: Alert[];
    disksWithTestResults: SmartTestResults[];
    tempAgg: DiskTemperatureAgg;
  }> {
    const disksNames = disks.map((disk) => disk.name);
    return combineLatest({
      disks: of(disks),
      alerts: this.getTemperatureAlerts(disksNames),
      disksWithTestResults: this.getSmartResults(disksNames),
      tempAgg: this.getDiskTempAggregates(disksNames),
    });
  }

  getTemperatureAlerts(disksNames: string[]): Observable<Alert[]> {
    return this.ws.call('disk.temperature_alerts', [disksNames]);
  }

  getSmartResults(disksNames: string[]): Observable<SmartTestResults[]> {
    return this.ws.call('smart.test.results', [[['disk', 'in', disksNames]]]);
  }

  getDiskTempAggregates(disksNames: string[]): Observable<DiskTemperatureAgg> {
    return this.ws.call('disk.temperature_agg', [disksNames, 14]);
  }

  getProcessedDisks(
    {
      disks, alerts, disksWithTestResults, tempAgg,
    }: {
      disks: StorageDashboardDisk[];
      alerts: Alert[];
      disksWithTestResults: SmartTestResults[];
      tempAgg: DiskTemperatureAgg;
    },
  ): Observable<StorageDashboardDisk[]> {
    for (const disk of disks) {
      disk.smartTests = 0;
      disk.alerts = [];
    }
    for (const alert of alerts) {
      const alertArgs = ((alert.args) as { device: string; message: string });
      const alertDevice = alertArgs.device.split('/').reverse()[0];
      const alertDisk = disks.find((disk) => disk.name === alertDevice);
      alertDisk.alerts.push(alert);
    }
    (disksWithTestResults as unknown as StorageDashboardDisk[]).forEach((diskWithResults) => {
      const testDisk = disks.find((disk) => disk.devname === diskWithResults.devname);
      const tests = diskWithResults?.tests ?? [];
      const testsStillRunning = tests.filter((test) => test.status !== SmartTestResultStatus.Running);
      testDisk.smartTests = testsStillRunning.length;
    });
    const disksWithTempData = Object.keys(tempAgg);
    for (const diskWithTempData of disksWithTempData) {
      const disk = disks.find((disk) => disk.devname === diskWithTempData);
      if (disk) {
        disk.tempAggregates = { ...tempAgg[diskWithTempData] };
      }
    }
    return of(disks);
  }
}
