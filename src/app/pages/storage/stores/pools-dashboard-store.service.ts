import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { keyBy, sortBy } from 'lodash-es';
import {
  combineLatest, forkJoin, Observable, of, tap,
} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export interface PoolsDashboardState {
  arePoolsLoading: boolean;
  areDisksLoading: boolean;
  pools: Pool[];
  rootDatasets: Record<string, Dataset>;
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
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogService: DialogService,
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
          pools: sortBy(pools, (pool) => pool.name),
          rootDatasets: keyBy(rootDatasets, (dataset) => dataset.id),
        });
      },
      (error: unknown) => {
        this.patchState({
          arePoolsLoading: false,
        });
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    );
  }

  getPools(): Observable<Pool[]> {
    return this.api.callAndSubscribe('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  getRootDatasets(): Observable<Dataset[]> {
    return this.api.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]);
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
      (error: unknown) => {
        this.patchState({
          areDisksLoading: false,
        });
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    );
  }

  getDisks(): Observable<Disk[]> {
    return this.api.call('disk.query', [[], { extra: { pools: true } }]);
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
    return this.api.call('disk.temperature_alerts', [disksNames]);
  }

  getSmartResults(disksNames: string[]): Observable<SmartTestResults[]> {
    return this.api.call('smart.test.results', [[['disk', 'in', disksNames]]]);
  }

  getDiskTempAggregates(disksNames: string[]): Observable<DiskTemperatureAgg> {
    return this.api.call('disk.temperature_agg', [disksNames, 14]).pipe(
      catchError((error: unknown) => {
        console.error('Error loading temperature: ', error);
        return of({});
      }),
    );
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
      disk.smartTestsRunning = 0;
      disk.smartTestsFailed = 0;
      disk.alerts = [];
    }
    for (const alert of alerts) {
      const alertArgs = (alert.args) as { device: string; message: string };
      const alertDevice = alertArgs.device.split('/').reverse()[0];
      const alertDisk = disks.find((disk) => disk.name === alertDevice);
      alertDisk.alerts.push(alert);
    }
    (disksWithTestResults as unknown as StorageDashboardDisk[]).forEach((diskWithResults) => {
      const testDisk = disks.find((disk) => disk.devname === diskWithResults.devname);
      const tests = diskWithResults?.tests ?? [];
      const testsStillRunning = tests.filter((test) => test.status === SmartTestResultStatus.Running);
      const testsStillFailed = tests.filter((test) => test.status === SmartTestResultStatus.Failed);
      testDisk.smartTestsRunning = testsStillRunning.length;
      testDisk.smartTestsFailed = testsStillFailed.length;
    });
    const disksWithTempData = Object.keys(tempAgg);
    for (const diskWithTempData of disksWithTempData) {
      const dashboardDisk = disks.find((disk) => disk.devname === diskWithTempData);
      if (dashboardDisk) {
        dashboardDisk.tempAggregates = { ...tempAgg[diskWithTempData] };
      }
    }
    return of(disks);
  }
}
