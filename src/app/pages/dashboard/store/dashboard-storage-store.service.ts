import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import _ from 'lodash';
import {
  Observable, map, of, switchMap, tap,
} from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { WebSocketService } from 'app/services/ws.service';

export interface DashboardStorageState {
  pools: Pool[];
  volumesData: VolumesData;
  isLoading: boolean;
}

const initialState: DashboardStorageState = {
  pools: [],
  isLoading: false,
  volumesData: {},
};

@UntilDestroy()
@Injectable()
export class DashboardStorageStore extends ComponentStore<DashboardStorageState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly volumesData$ = this.select((state) => state.volumesData);
  readonly isLoading$ = this.select((state) => state.isLoading);

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
    this.initialize();
    this.listenToPoolUpdates().subscribe();
    this.listenForScanUpdates().subscribe();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState((state) => ({
        ...state,
        isLoading: true,
      }))),
      switchMap(() => this.loadPoolData()),
      tap(() => this.setState((state) => ({
        ...state,
        isLoading: false,
      }))),
    );
  });

  private loadPoolData(): Observable<unknown> {
    return this.ws.call('pool.query').pipe(
      tap((pools) => {
        this.setState((state) => {
          return {
            ...state,
            pools,
          };
        });
      }),
      switchMap((pools) => {
        if (pools?.length) {
          return this.loadVolumeData();
        }
        return of(pools);
      }),
    );
  }

  private setVolumeData(data: Dataset[]): void {
    const vd: VolumesData = {};

    data.forEach((dataset) => {
      if (typeof dataset === undefined || !dataset) { return; }
      const usedPercent = dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed);
      const zvol = {
        avail: dataset.available.parsed,
        id: dataset.id,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (usedPercent * 100).toFixed(0) + '%',
      };

      vd[zvol.id] = zvol;
    });

    this.setState((state) => {
      return {
        ...state,
        volumesData: vd,
      };
    });
  }

  private listenToPoolUpdates(): Observable<unknown> {
    return this.ws.subscribe('pool.query').pipe(
      switchMap(() => this.loadPoolData()),
    );
  }

  private loadVolumeData(): Observable<Dataset[]> {
    return this.ws.call(
      'pool.dataset.query',
      [[], { extra: { retrieve_children: false } }],
    ).pipe(
      tap((datasets) => {
        this.setVolumeData(datasets);
      }),
    );
  }

  private listenForScanUpdates(): Observable<unknown> {
    return this.ws.subscribe('zfs.pool.scan').pipe(
      map((apiEvent: ApiEvent<PoolScan>) => apiEvent.fields),
      tap((poolScan: PoolScan) => {
        this.setState((state) => {
          const pools = _.cloneDeep(state.pools).map((pool) => {
            if (pool.name === poolScan.name) {
              pool.scan = poolScan.scan;
            }
            return pool;
          });
          return {
            ...state,
            pools,
          };
        });
      }),
    );
  }
}
