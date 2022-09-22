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
import { StorageDashboardDisk } from 'app/interfaces/storage.interface';
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
      switchMap(() => {
        return forkJoin({
          dashboardPools: combineLatest({
            pools: this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]),
            rootDatasets: this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]),
          }).pipe(
            tapResponse(({ pools, rootDatasets }) => {
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
            }),
          ),
          dashboardDisks: this.ws.call('disk.query', [[], { extra: { pools: true } }]).pipe(
            switchMap((disks: StorageDashboardDisk[]) => {
              const diskNames = disks.map((disk) => disk.name);
              return combineLatest({
                disks: of(disks),
                alerts: this.ws.call('disk.temperature_alerts', [diskNames]),
                disksWithTestResults: this.ws.call('smart.test.results', [[['disk', 'in', diskNames]]]),
                tempAgg: this.ws.call('disk.temperature_agg', [diskNames, 14]),
              });
            }),
            switchMap(({
              disks, alerts, disksWithTestResults, tempAgg,
            }) => {
              for (const disk of disks) {
                disk.smartTests = 0;
                disk.alerts = [];
              }
              for (const alert of alerts as Alert[]) {
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
                disk.tempAggregates = { ...tempAgg[diskWithTempData] };
              }
              return of(disks);
            }),
          ).pipe(
            tapResponse((disks: StorageDashboardDisk[]) => {
              this.patchState({
                disks,
                areDisksLoading: false,
              });
            },
            (error: WebsocketError) => {
              this.patchState({
                areDisksLoading: false,
              });
              new EntityUtils().handleWsError(this, error, this.dialogService);
            }),
          ),
        });
      }),
    );
  });
}
