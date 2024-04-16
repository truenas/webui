import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import _ from 'lodash';
import {
  Observable, filter, map, switchMap, tap,
} from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { VolumeData, VolumesData } from 'app/interfaces/volume-data.interface';
import { WebSocketService } from 'app/services/ws.service';

export interface DashboardStorageState {
  pools: Pool[];
  volumesData: VolumesData;
  isLoading: boolean;
}

const initialState: DashboardStorageState = {
  pools: [],
  isLoading: false,
  volumesData: null,
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
    this.listenToLoadVolumeData().pipe(untilDestroyed(this)).subscribe();
    this.listenForScanUpdates().pipe(untilDestroyed(this)).subscribe();
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

  private loadPoolData(): Observable<Pool[]> {
    return this.ws.callAndSubscribe('pool.query').pipe(
      tap((pools) => this.setState((state) => ({ ...state, pools }))),
    );
  }

  private setVolumeData(data: Dataset[]): void {
    const volumesData = new Map<string, VolumeData>();

    data.forEach((dataset) => {
      if (typeof dataset === undefined || !dataset) { return; }

      volumesData.set(dataset.id, {
        id: dataset.id,
        avail: dataset.available.parsed,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed) * 100).toFixed(0) + '%',
      });
    });

    this.setState((state) => ({ ...state, volumesData }));
  }

  private listenToLoadVolumeData(): Observable<Dataset[]> {
    return this.pools$.pipe(
      filter((pools) => pools.length > 0),
      switchMap(() => this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }])),
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
          return { ...state, pools };
        });
      }),
    );
  }
}
